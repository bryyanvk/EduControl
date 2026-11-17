import time
from machine import Pin, SPI
from mfrc522 import MFRC522

leitor = MFRC522(2, 3, 4, 0, 5)
leitor.spi = SPI(0, baudrate=1000000, polarity=0, phase=0, sck=Pin(2), mosi=Pin(3), miso=Pin(4))
leitor.init()
leitor._wreg(0x26, 0x40)


def ler(limpar_coll, tipo):
    leitor.antenna_on(False)
    time.sleep_ms(5)
    leitor.antenna_on(True)
    time.sleep_ms(5)
    if limpar_coll:
        # zera o bit ValuesAfterColl (como a biblioteca do Arduino faz)
        leitor._wreg(0x0E, leitor._rreg(0x0E) & 0x7F)
    else:
        leitor._wreg(0x0E, leitor._rreg(0x0E) | 0x80)
    estado, bits = leitor.request(tipo)
    if estado != leitor.OK:
        return "sem", ""
    estado, bruto = leitor.anticoll()
    info = "err=" + hex(leitor._rreg(0x06)) + " coll=" + hex(leitor._rreg(0x0E)) + " fifo=" + str(leitor._rreg(0x0A))
    if estado != leitor.OK or len(bruto) < 4:
        return "falhou", info
    uid = ""
    for i in range(4):
        uid = uid + "%02X" % bruto[i]
    return uid, info


print("Encoste o cartao no centro da antena e NAO mexa")
time.sleep(4)

for limpar in (True, False):
    for nome, tipo in (("REQIDL", leitor.REQIDL), ("REQALL", leitor.REQALL)):
        certos = 0
        falhas = 0
        sem = 0
        ultimo = ""
        info_falha = ""
        for n in range(15):
            r, info = ler(limpar, tipo)
            if r == "sem":
                sem = sem + 1
            elif r == "falhou":
                falhas = falhas + 1
                info_falha = info
            else:
                certos = certos + 1
                ultimo = r
            time.sleep_ms(100)
        print("limpar_coll", limpar, nome, "| leu:", certos, "falhou:", falhas, "sem:", sem, "uid:", ultimo, info_falha)

print("Fim do teste")
