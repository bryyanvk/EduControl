import time
from mfrc522 import MFRC522

leitor = MFRC522(2, 3, 4, 0, 5)
leitor._wreg(0x26, 0x70)
print("Ganho:", hex(leitor._rreg(0x26)))
print("Antena:", hex(leitor._rreg(0x14)))

while True:
    estado, bits = leitor.request(leitor.REQALL)
    print("estado:", estado, "bits:", bits)
    if estado == leitor.OK:
        estado, bruto = leitor.anticoll()
        print("uid bruto:", bruto)
    time.sleep(1)
