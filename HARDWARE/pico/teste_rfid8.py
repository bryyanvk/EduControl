import time
from machine import Pin, SPI
from mfrc522 import MFRC522

leitor = MFRC522(2, 3, 4, 0, 5)


def hexa(lista):
    texto = ""
    for b in lista:
        texto = texto + "%02X" % b
    return texto


def tentar(coll, gain, parity_reg, usar_wupa):
    leitor.antenna_on(False)
    time.sleep_ms(5)
    leitor.antenna_on(True)
    time.sleep_ms(5)
    leitor._wreg(0x26, gain)
    leitor._wreg(0x1D, parity_reg)
    if coll:
        leitor._wreg(0x0E, leitor._rreg(0x0E) & 0x7F)
    leitor._wreg(0x0D, 0x07)
    if usar_wupa:
        est1, rec1, bits1 = leitor._tocard(0x0C, [0x52])
    else:
        est1, rec1, bits1 = leitor._tocard(0x0C, [0x26])
    if est1 != 0:
        return "sem-ATQA"
    leitor._wreg(0x0D, 0x00)
    est2, rec2, bits2 = leitor._tocard(0x0C, [0x93, 0x20])
    if est2 == 0:
        return "UID=" + hexa(rec2)
    return "SEL-falhou(" + str(est2) + ")"


print("Antes: MfTx", hex(leitor._rreg(0x1C)), "MfRx", hex(leitor._rreg(0x1D)), "Coll", hex(leitor._rreg(0x0E)), "RxThr", hex(leitor._rreg(0x18)), "Demod", hex(leitor._rreg(0x19)), "ModW", hex(leitor._rreg(0x24)), "GsN", hex(leitor._rreg(0x27)), "CWGs", hex(leitor._rreg(0x28)), "ModGs", hex(leitor._rreg(0x29)))
leitor._wreg(0x26, 0x70)
print("Escreveu 0x70 em RFCfg, leu de volta:", hex(leitor._rreg(0x26)))
print("Encoste o cartao no centro da antena e NAO mexa")
time.sleep(4)

for gain in (0x20, 0x40, 0x70):
    for coll in (False, True):
        for parity_reg in (0x00, 0x10):
            for wupa in (False, True):
                resultados = {}
                for n in range(6):
                    r = tentar(coll, gain, parity_reg, wupa)
                    resultados[r] = resultados.get(r, 0) + 1
                    time.sleep_ms(120)
                print("ganho", hex(gain), "coll", coll, "MfRx", hex(parity_reg), "wupa", wupa, "->", resultados)

print("Fim do teste")
