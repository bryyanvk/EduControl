import time
from machine import Pin, SPI
from mfrc522 import MFRC522

VELOCIDADE = 1000000

leitor = MFRC522(2, 3, 4, 0, 5)
leitor.spi = SPI(0, baudrate=VELOCIDADE, polarity=0, phase=0, sck=Pin(2), mosi=Pin(3), miso=Pin(4))
leitor.init()

print("Versao do chip:", hex(leitor._rreg(0x37)))
print("Velocidade SPI:", VELOCIDADE)
print("Aproxime o cartao")

while True:
    estado, bits = leitor.request(leitor.REQIDL)
    if estado == leitor.OK:
        print("cartao detectado, bits:", bits)
        for tentativa in range(5):
            estado, bruto = leitor.anticoll()
            erros = leitor._rreg(0x06)
            print("tentativa", tentativa, "estado:", estado, "erros:", hex(erros), "bruto:", bruto)
            if estado == leitor.OK:
                break
        uid = ""
        if estado == leitor.OK:
            for i in range(4):
                uid = uid + "%02X" % bruto[i]
            print('{"uid":"' + uid + '"}')
        time.sleep(1)
    time.sleep_ms(100)
