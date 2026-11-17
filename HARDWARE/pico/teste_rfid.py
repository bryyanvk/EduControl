import time
from mfrc522 import MFRC522

leitor = MFRC522(2, 3, 4, 0, 5)

versao = leitor._rreg(0x37)
print("Versao do chip:", hex(versao))

if versao == 0x00 or versao == 0xFF:
    print("RC522 nao respondeu. Confira a fiacao e a alimentacao 3.3V.")
else:
    print("RC522 respondeu. Aproxime um cartao.")

while True:
    estado, tipo = leitor.request(leitor.REQIDL)
    if estado == leitor.OK:
        estado, bruto = leitor.anticoll()
        if estado == leitor.OK:
            uid = ""
            for i in range(4):
                uid = uid + "%02X" % bruto[i]
            print('{"uid":"' + uid + '"}')
            time.sleep(1)
    time.sleep_ms(100)
