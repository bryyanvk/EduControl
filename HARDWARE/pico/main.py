import sys
import time
import select
from machine import Pin, SPI
from lcd1602 import LCD

# EduControl - leitor RC522 + LCD 1602
# RC522: SCK=GP2, MOSI=GP3, MISO=GP4, RST=GP0, CS=GP5
# LCD:   RS=GP16, E=GP17, D4..D7=GP18..GP21

lcd = LCD(16, 17, 18, 19, 20, 21)

cs = Pin(5, Pin.OUT)
rst = Pin(0, Pin.OUT)
cs.value(1)
rst.value(0)
time.sleep_ms(50)
rst.value(1)
time.sleep_ms(50)

spi = SPI(0, baudrate=1000000, polarity=0, phase=0, sck=Pin(2), mosi=Pin(3), miso=Pin(4))

# o ganho do receptor muda a cada rodada (ajuda o chaveiro e o cartao)
GANHOS = [0x70, 0x50, 0x30]
rodada = 0

entrada = select.poll()
entrada.register(sys.stdin, select.POLLIN)


def escrever(reg, valor):
    cs.value(0)
    spi.write(bytes([(reg << 1) & 0x7E, valor]))
    cs.value(1)


def ler(reg):
    saida = bytearray(2)
    cs.value(0)
    spi.write_readinto(bytes([((reg << 1) & 0x7E) | 0x80, 0]), saida)
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
    spi.write(bytes([(0x09 << 1) & 0x7E]) + bytes(dados))
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

    # 1) pede ao cartao que se apresente (ATQA = 2 bytes)
    apareceu = False
    for tentativa in range(3):
        estado, dados = transmitir([0x26], 0x07)
        if len(dados) == 2:
            apareceu = True
            break
        time.sleep_ms(5)
    if not apareceu:
        return None

    # 2) pede o numero do cartao (4 bytes + 1 de verificacao)
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


def esperar_resposta(tempo_ms):
    inicio = time.ticks_ms()
    texto = ""
    while time.ticks_diff(time.ticks_ms(), inicio) < tempo_ms:
        if entrada.poll(50):
            letra = sys.stdin.read(1)
            if letra == "\n":
                return texto
            if letra != "\r":
                texto = texto + letra
    return ""


def tela_inicial():
    lcd.mostrar("EduControl", "Aproxime cartao")


iniciar()
tela_inicial()

while True:
    ganho = GANHOS[rodada % len(GANHOS)]
    rodada = rodada + 1
    uid = ler_cartao(ganho)

    if uid:
        lcd.mostrar("Cartao lido", uid)
        print('{"uid":"' + uid + '"}')

        resposta = esperar_resposta(4000)

        if resposta == "":
            lcd.mostrar("Sem resposta", "do sistema")
        else:
            partes = resposta.split("|")
            if len(partes) >= 2:
                lcd.mostrar(partes[0], partes[1])
            else:
                lcd.mostrar(resposta, "")

        time.sleep(2)

        # espera tirar o cartao da antena antes de ler de novo
        sem_cartao = 0
        while sem_cartao < 4:
            if ler_cartao(0x70) is None:
                sem_cartao = sem_cartao + 1
            else:
                sem_cartao = 0
            time.sleep_ms(150)

        tela_inicial()

    time.sleep_ms(100)
