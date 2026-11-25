
from time import ticks_ms, ticks_add, ticks_diff, sleep_ms
from machine import Pin, SPI
from lcd1602 import LCD
from dhcp_client import iniciar_dhcp


# ==========================================
# CONFIGURACOES EDUCONTROL
# ==========================================

IP_SERVIDOR = bytes([172, 16, 30, 20])

PORTA_SERVIDOR = 5005
PORTA_LOCAL = 5006

TEMPO_RESPOSTA = 8000

ntw = None
ack_recebido = False
mensagem_ack = ""

lcd = LCD(16, 17, 18, 19, 20, 21)


# ==========================================
# LCD
# ==========================================

def tela_inicial():
    lcd.mostrar("EduControl", "Aproxime cartao")


# ==========================================
# ETHERNET / DHCP
# ==========================================

def iniciar_ethernet():

    print("================================")
    print(" EDUCONTROL - INICIANDO REDE")
    print("================================")

    rede = iniciar_dhcp()

    if rede is None:
        raise RuntimeError("Falha ao iniciar DHCP")

    print("Ethernet pronta para uso!")

    return rede


# ==========================================
# UDP - RECEBIMENTO
# ==========================================

def receber_udp(pkt):

    global ack_recebido, mensagem_ack

    dados = bytes(pkt.udp_data)

    mensagem = dados.decode(
        "utf-8",
        "replace"
    )

    print("\n[UDP] Resposta recebida:")
    print(mensagem)

    if mensagem.startswith("EDUCONTROL_ACK"):

        mensagem_ack = mensagem
        ack_recebido = True


# ==========================================
# UDP - ENVIO DA PRESENCA
# ==========================================

def enviar_presenca(uid):

    global ack_recebido, mensagem_ack

    if ntw is None:

        print("[ERRO] Ethernet indisponivel!")
        return False

    ack_recebido = False
    mensagem_ack = ""

    print("\n================================")
    print(" EDUCONTROL - ENVIO UDP")
    print("================================")

    print("[RFID] UID:", uid)

    corpo = '{"uid":"' + uid + '"}'

    dados = corpo.encode("utf-8")

    print("[UDP] Destino: 172.16.30.20")
    print("[UDP] Porta:", PORTA_SERVIDOR)
    print("[UDP] Conteudo:", corpo)

    # --------------------------------------
    # RESOLUCAO ARP
    # --------------------------------------

    print("\n[ARP] Procurando servidor...")

    ntw.connectIp4(IP_SERVIDOR)

    prazo = ticks_add(ticks_ms(), 5000)

    while ticks_diff(prazo, ticks_ms()) > 0:

        ntw.rxAllPkt()

        if ntw.isConnectedIp4(IP_SERVIDOR):

            print("[ARP] Servidor encontrado!")
            break

        sleep_ms(10)

    else:

        print("[ARP] Servidor nao encontrado.")
        return False

    # --------------------------------------
    # ENVIO UDP
    # --------------------------------------

    print("\n[UDP] Enviando presenca...")

    resultado = ntw.sendUdp4(
        IP_SERVIDOR,
        PORTA_SERVIDOR,
        dados,
        src_port=PORTA_LOCAL
    )

    print("[UDP] Resultado do envio:", resultado)

    if resultado < 0:

        print("[UDP] Falha ao enviar mensagem.")
        return False

    # --------------------------------------
    # AGUARDAR ACK
    # --------------------------------------

    print("\n[UDP] Aguardando resposta do servidor...")

    prazo = ticks_add(
        ticks_ms(),
        TEMPO_RESPOSTA
    )

    while ticks_diff(prazo, ticks_ms()) > 0:

        ntw.rxAllPkt()

        if ack_recebido:

            print("\n[UDP] ACK confirmado!")
            print("[UDP] Servidor recebeu a mensagem.")

            return True

        sleep_ms(10)

    print("\n[UDP] Timeout aguardando ACK.")

    return False


# ==========================================
# RFID - RC522 / SPI0
# ==========================================

cs = Pin(5, Pin.OUT)
rst = Pin(0, Pin.OUT)

cs.value(1)
rst.value(0)

sleep_ms(50)

rst.value(1)

sleep_ms(50)

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

    spi.write(
        bytes([(reg << 1) & 0x7E, valor])
    )

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

    sleep_ms(50)

    escrever(0x2A, 0x80)
    escrever(0x2B, 0xA9)
    escrever(0x2C, 0x03)
    escrever(0x2D, 0xE8)
    escrever(0x15, 0x40)
    escrever(0x11, 0x3D)
    escrever(0x14, ler(0x14) | 0x03)


def reiniciar_antena():

    escrever(0x14, ler(0x14) & 0xFC)

    sleep_ms(5)

    escrever(0x14, ler(0x14) | 0x03)

    sleep_ms(5)


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

    inicio = ticks_ms()
    irq = 0

    while ticks_diff(ticks_ms(), inicio) < 40:

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

        sleep_ms(5)

    if not apareceu:
        return None

    for tentativa in range(3):

        estado, dados = transmitir([0x93, 0x20], 0x00)

        if estado == "ok" and len(dados) == 5:

            if (
                dados[0] ^ dados[1] ^
                dados[2] ^ dados[3]
            ) == dados[4]:

                uid = ""

                for i in range(4):
                    uid += "%02X" % dados[i]

                return uid

        sleep_ms(5)

    return ""


# ==========================================
# INICIALIZACAO DO SISTEMA
# ==========================================

def main():

    global ntw, rodada

    lcd.mostrar("EduControl", "Iniciando...")

    try:

        ntw = iniciar_ethernet()

        print("\n[UDP] Registrando callback...")

        ntw.registerUdp4Callback(
            PORTA_LOCAL,
            receber_udp
        )

        print("[UDP] Callback registrado!")

        lcd.mostrar("Rede conectada", "Sistema pronto")

        print("\nEthernet pronta!")
        print("Servidor: 172.16.30.20")
        print("Porta UDP:", PORTA_SERVIDOR)
        print("Porta local:", PORTA_LOCAL)

    except Exception as erro:

        print("ERRO NA ETHERNET:", erro)

        ntw = None

        lcd.mostrar("Sem Ethernet", "Modo local")

    iniciar()

    tela_inicial()

    # ======================================
    # LOOP PRINCIPAL
    # ======================================

    while True:

        ganho = GANHOS[rodada % len(GANHOS)]

        uid = ler_cartao(ganho)

        if uid:

            print("\nCartao identificado:", uid)

            lcd.mostrar("Cartao lido", uid)

            if enviar_presenca(uid):

                print("[EDUCONTROL] Comunicacao confirmada!")

                lcd.mostrar(
                    "Envio confirmado",
                    "Servidor recebeu"
                )

            else:

                print("[EDUCONTROL] Falha na comunicacao.")

                lcd.mostrar(
                    "Falha no envio",
                    "Verifique rede"
                )

            sleep_ms(2000)

            sem_cartao = 0

            while sem_cartao < 4:

                if ler_cartao(0x70) is None:

                    sem_cartao += 1

                else:

                    sem_cartao = 0

                sleep_ms(150)

            tela_inicial()

        rodada += 1

        sleep_ms(100)


if __name__ == "__main__":

    main()
