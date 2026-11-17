import time
from machine import Pin, SPI
from mfrc522 import MFRC522

leitor = MFRC522(2, 3, 4, 0, 5)
leitor.spi = SPI(0, baudrate=1000000, polarity=0, phase=0, sck=Pin(2), mosi=Pin(3), miso=Pin(4))
leitor.init()
leitor._wreg(0x26, 0x40)

print("Registradores: Mode", hex(leitor._rreg(0x11)), "TxMode", hex(leitor._rreg(0x12)), "RxMode", hex(leitor._rreg(0x13)), "TxControl", hex(leitor._rreg(0x14)), "TxASK", hex(leitor._rreg(0x15)), "RFCfg", hex(leitor._rreg(0x26)))
print("Encoste o cartao no centro da antena e NAO mexa")
time.sleep(4)


def bytes_hex(lista):
    texto = ""
    for b in lista:
        texto = texto + "%02X " % b
    return texto


for atraso in (0, 2, 10):
    print("--- atraso entre REQA e SELECT:", atraso, "ms ---")
    for n in range(5):
        leitor.antenna_on(False)
        time.sleep_ms(5)
        leitor.antenna_on(True)
        time.sleep_ms(5)
        leitor._wreg(0x0D, 0x07)
        est1, rec1, bits1 = leitor._tocard(0x0C, [0x26])
        irq1 = leitor._rreg(0x04)
        time.sleep_ms(atraso)
        leitor._wreg(0x0D, 0x00)
        est2, rec2, bits2 = leitor._tocard(0x0C, [0x93, 0x20])
        irq2 = leitor._rreg(0x04)
        err2 = leitor._rreg(0x06)
        print("REQA:", est1, bytes_hex(rec1), bits1, "irq", hex(irq1), "| SEL:", est2, bytes_hex(rec2), bits2, "irq", hex(irq2), "err", hex(err2))
        time.sleep_ms(200)

print("Fim do teste")
