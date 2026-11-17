import time
from machine import Pin, SPI

# Leitor RC522 independente (nao usa mfrc522.py)
# Fiacao: SCK=GP2, MOSI=GP3, MISO=GP4, RST=GP0, CS=GP5

cs = Pin(5, Pin.OUT)
rst = Pin(0, Pin.OUT)
cs.value(1)
rst.value(0)
time.sleep_ms(50)
rst.value(1)
time.sleep_ms(50)

spi = None


def abrir_spi(velocidade):
    global spi
    spi = SPI(0, baudrate=velocidade, polarity=0, phase=0, sck=Pin(2), mosi=Pin(3), miso=Pin(4))


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
    escrever(0x26, 0x70)
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
        return "timeout", [], 0, irq, ler(0x06)

    erro = ler(0x06)
    if erro & 0x13:
        return "erro", [], 0, irq, erro

    quantidade = ler(0x0A)
    bits_validos = ler(0x0C) & 0x07
    recebido = []
    for i in range(quantidade):
        recebido.append(ler(0x09))
    return "ok", recebido, bits_validos, irq, erro


def texto(lista):
    t = ""
    for b in lista:
        t = t + "%02X" % b
    return t


abrir_spi(1000000)
print("Versao do chip:", hex(ler(0x37)))
print("Encoste o cartao deitado no centro da antena e NAO mexa")
time.sleep(4)

for velocidade in (1000000, 100000):
    abrir_spi(velocidade)
    iniciar()
    print("--- SPI", velocidade, "| RFCfg lido:", hex(ler(0x26)), "---")
    for n in range(6):
        reiniciar_antena()
        escrever(0x0E, ler(0x0E) & 0x7F)
        s1, r1, b1, irq1, e1 = transmitir([0x26], 0x07)
        if s1 != "ok":
            print("REQA:", s1, "irq", hex(irq1), "erro", hex(e1))
            time.sleep_ms(200)
            continue
        s2, r2, b2, irq2, e2 = transmitir([0x93, 0x20], 0x00)
        if s2 == "ok" and len(r2) == 5:
            bcc = r2[0] ^ r2[1] ^ r2[2] ^ r2[3]
            if bcc == r2[4]:
                print("REQA ok", texto(r1), "| UID:", texto(r2[0:4]), "<<<<<< LEU")
            else:
                print("REQA ok", texto(r1), "| UID com BCC errado:", texto(r2))
        else:
            print("REQA ok", texto(r1), "| SEL:", s2, texto(r2), "irq", hex(irq2), "erro", hex(e2))
        time.sleep_ms(200)

print("Fim do teste")
