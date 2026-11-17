import time
import mfrc522
from mfrc522 import MFRC522

if getattr(mfrc522, "CORRIGIDO", False):
    print("OK: mfrc522.py corrigido esta na Pico")
else:
    print("ERRO: a Pico ainda tem o mfrc522.py ANTIGO. Salve o novo em Raspberry Pi Pico")

leitor = MFRC522(2, 3, 4, 0, 5)
print("Versao do chip:", hex(leitor._rreg(0x37)))
print("Aproxime o cartao ou o chaveiro (30 segundos)")

fim = time.ticks_add(time.ticks_ms(), 30000)
while time.ticks_diff(fim, time.ticks_ms()) > 0:
    estado, tipo = leitor.request(leitor.REQIDL)
    if estado == leitor.OK:
        estado, bruto = leitor.anticoll()
        print("estado", estado, "bruto", bruto)
        if estado == leitor.OK:
            uid = ""
            for i in range(4):
                uid = uid + "%02X" % bruto[i]
            print('{"uid":"' + uid + '"}')
            time.sleep(1)
    time.sleep_ms(100)

print("Fim")
