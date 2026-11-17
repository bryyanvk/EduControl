import time
from machine import Pin, SPI
from mfrc522 import MFRC522

leitor = MFRC522(2, 3, 4, 0, 5)

velocidades = [1000000, 200000]
ganhos = [0x40, 0x70]


def ler_uid():
    leitor.antenna_on(False)
    time.sleep_ms(5)
    leitor.antenna_on(True)
    time.sleep_ms(5)
    estado, bits = leitor.request(leitor.REQALL)
    if estado != leitor.OK:
        return "sem"
    estado, bruto = leitor.anticoll()
    if estado != leitor.OK:
        return "falhou"
    uid = ""
    for i in range(4):
        uid = uid + "%02X" % bruto[i]
    return uid


print("Encoste o cartao na antena e NAO mexa durante o teste")
time.sleep(4)

for velocidade in velocidades:
    for ganho in ganhos:
        leitor.spi = SPI(0, baudrate=velocidade, polarity=0, phase=0, sck=Pin(2), mosi=Pin(3), miso=Pin(4))
        leitor.init()
        leitor._wreg(0x26, ganho)
        certos = 0
        falhas = 0
        sem_cartao = 0
        ultimo = ""
        for n in range(20):
            resultado = ler_uid()
            if resultado == "sem":
                sem_cartao = sem_cartao + 1
            elif resultado == "falhou":
                falhas = falhas + 1
            else:
                certos = certos + 1
                ultimo = resultado
            time.sleep_ms(100)
        print("velocidade", velocidade, "ganho", hex(ganho), "| leu:", certos, "falhou:", falhas, "sem cartao:", sem_cartao, "uid:", ultimo)

print("Fim do teste")
