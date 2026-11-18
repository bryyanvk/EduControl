
import time
import ujson
from machine import Pin, SPI
from lcd1602 import LCD

import Ntw
from dhcp import DHCPClient


# ==========================================
# EDUCONTROL - CONFIGURACOES
# ==========================================

IP_SERVIDOR = bytes([172, 16, 30, 19])
PORTA_SERVIDOR = 5005
PORTA_CLIENTE = 5006

ntw = None
resposta_udp = None

lcd = LCD(16, 17, 18, 19, 20, 21)


# ==========================================
# ETHERNET - ENC28J60 / SPI1
# ==========================================

def receber_resposta(pkt):
    global resposta_udp

    mensagem = bytes(pkt.udp_data)
    resposta_udp = mensagem.decode("utf-8")

    print("Resposta do servidor:", resposta_udp)


def iniciar_ethernet():

    print("================================")
    print(" EDUCONTROL - INICIANDO REDE")
    print("================================")

    spi_eth = SPI(
        1,
        baudrate=2000000,
        sck=Pin(14),
        mosi=Pin(15),
        miso=Pin(12)
    )

    cs_eth = Pin(13)

    rede = Ntw.Ntw(spi_eth, cs_eth)

    print("Aguardando Ethernet...")

    inicio = time.ticks_ms()

    while not rede.isLinkUp():

        if time.ticks_diff(time.ticks_ms(), inicio) > 15000:
            raise RuntimeError("Ethernet desconectada")

        time.sleep_ms(500)

    print("Ethernet conectada!")
    print("Solicitando IP pelo DHCP...")

    dhcp = DHCPClient(rede)

    if not dhcp.start():
        raise RuntimeError("Falha no DHCP")

    rede.registerUdp4Callback(
        PORTA_CLIENTE,
        receber_resposta
    )

    print("Configurando destino UDP...")

    rede.connectIp4(IP_SERVIDOR)

    inicio = time.ticks_ms()

    while not rede.isConnectedIp4(IP_SERVIDOR):

        rede.rxAllPkt()

        if time.ticks_diff(time.ticks_ms(), inicio) > 10000:
            raise RuntimeError("Falha ao localizar servidor")

        time.sleep_ms(50)

    print("Servidor localizado!")
    print("Rede pronta!")

    return rede


# ==========================================
# ENVIO DE PRESENCA UDP
# ==========================================

def enviar_presenca(uid):

    global resposta_udp

    if ntw is None:
        print("Ethernet indisponivel!")
        return False

    dados = {
        "uid": uid,
        "origem": "EDUCONTROL_RFID",
        "evento": "LEITURA_CARTAO"
    }

    mensagem = ujson.dumps(dados).encode("utf-8")

    resposta_udp = None

    print("\nEnviando presenca...")
    print("Dados:", mensagem)

    resultado = ntw.sendUdp4(
        IP_SERVIDOR,
        PORTA_SERVIDOR,
        mensagem,
        src_port=PORTA_CLIENTE
    )

    print("Resultado do envio:", resultado)

    inicio = time.ticks_ms()

    while time.ticks_diff(time.ticks_ms(), inicio) < 4000:

        ntw.rxAllPkt()

        if resposta_udp is not None:

            print("Confirmacao recebida!")
            return True

        time.sleep_ms(10)

    print("Servidor nao respondeu!")
    return False


# ==========================================
# RFID - RC522 / SPI0
# ==========================================

cs = Pin(5, Pin.OUT)
rst = Pin(0, Pin.OUT)

cs.value(1)
rst.value(0)

time.sleep_ms(50)

rst.value(1)

time.sleep_ms(50)

spi = SPI(
    0,
    baudrate=1000000,
    polarity=0,
    phase=0,
    sck=Pin(2),
    mosi=Pin(3),
    miso=Pin(4)
)

GANHOS = [0x70, 0x50, 0x30]
rodada = 0


def escrever(reg, valor):

    cs.value(0)
    spi.write(bytes([(reg << 1) & 0x7E, valor]))
    cs.value(1)


def ler(reg):

    saida = bytearray(2)

    cs.value(0)

    spi.write_readinto(
        bytes([((reg << 1) & 0x7E) | 0x80, 0]),
        saida
    )

    cs.value(1)

    return saida[1]


def iniciar():

    escrever(0x01, 0x0F)

    time.sleep_ms(50)

    escrever(0x2A, 0x80)
    escrever(0x2B, 0xA9)
    escrever(0x2C, 0x03)
    escrever(0x2D, 0xE8)
    escrever(0x15, 0x40)
    escrever(0x11, 0x3D)
    escrever(0x14, ler(0x14) | 0x03)


def reiniciar_antena():

    escrever(0x14, ler(0x14) & 0xFC)

    time.sleep_ms(5)

    escrever(0x14, ler(0x14) | 0x03)

    time.sleep_ms(5)


def transmitir(dados, bits_finais):

    escrever(0x01, 0x00)
    escrever(0x04, 0x7F)
    escrever(0x0A, 0x80)

    cs.value(0)

    spi.write(
        bytes([(0x09 << 1) & 0x7E]) + bytes(dados)
    )

    cs.value(1)

    escrever(0x0D, bits_finais)
    escrever(0x01, 0x0C)
    escrever(0x0D, ler(0x0D) | 0x80)

    inicio = time.ticks_ms()
    irq = 0

    while time.ticks_diff(time.ticks_ms(), inicio) < 40:

        irq = ler(0x04)

        if irq & 0x31:
            break

    if not (irq & 0x30):
        return "timeout", []

    erro = ler(0x06)
    quantidade = ler(0x0A)

    if quantidade > 16:
        quantidade = 16

    recebido = []

    for i in range(quantidade):
        recebido.append(ler(0x09))

    if erro & 0x13:
        return "erro", recebido

    return "ok", recebido


def ler_cartao(ganho):

    reiniciar_antena()

    escrever(0x26, ganho)
    escrever(0x0E, ler(0x0E) & 0x7F)

    apareceu = False

    for tentativa in range(3):

        estado, dados = transmitir([0x26], 0x07)

        if len(dados) == 2:
            apareceu = True
            break

        time.sleep_ms(5)

    if not apareceu:
        return None

    for tentativa in range(3):

        estado, dados = transmitir([0x93, 0x20], 0x00)

        if estado == "ok" and len(dados) == 5:

            if dados[0] ^ dados[1] ^ dados[2] ^ dados[3] == dados[4]:

                uid = ""

                for i in range(4):
                    uid = uid + "%02X" % dados[i]

                return uid

        time.sleep_ms(5)

    return ""


# ==========================================
# LCD
# ==========================================

def tela_inicial():

    lcd.mostrar("EduControl", "Aproxime cartao")


# ==========================================
# INICIALIZACAO DO SISTEMA
# ==========================================

lcd.mostrar("EduControl", "Iniciando...")

try:

    ntw = iniciar_ethernet()

    lcd.mostrar("Rede conectada", "Sistema pronto")

    print("Ethernet pronta para uso!")

except Exception as erro:

    print("ERRO NA ETHERNET:", erro)

    ntw = None

    lcd.mostrar("Sem Ethernet", "Modo local")


iniciar()

tela_inicial()


# ==========================================
# LOOP PRINCIPAL
# ==========================================

while True:

    ganho = GANHOS[rodada % len(GANHOS)]

    rodada = rodada + 1

    uid = ler_cartao(ganho)

    if uid:

        print("\nCartao identificado:", uid)

        lcd.mostrar("Cartao lido", uid)

        if enviar_presenca(uid):

            lcd.mostrar("Presenca enviada", "Confirmada")

        else:

            lcd.mostrar("Falha no envio", "Verifique rede")

        time.sleep(2)

        sem_cartao = 0

        while sem_cartao < 4:

            if ler_cartao(0x70) is None:

                sem_cartao = sem_cartao + 1

            else:

                sem_cartao = 0

            time.sleep_ms(150)

        tela_inicial()

    time.sleep_ms(100)
