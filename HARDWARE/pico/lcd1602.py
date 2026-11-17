from machine import Pin
import time


class LCD:

    def __init__(self, rs, e, d4, d5, d6, d7):
        self.rs = Pin(rs, Pin.OUT)
        self.e = Pin(e, Pin.OUT)
        self.dados = [Pin(d4, Pin.OUT), Pin(d5, Pin.OUT), Pin(d6, Pin.OUT), Pin(d7, Pin.OUT)]
        self.rs.value(0)
        self.e.value(0)
        time.sleep_ms(50)
        self.enviar_nibble(0x03)
        time.sleep_ms(5)
        self.enviar_nibble(0x03)
        time.sleep_ms(1)
        self.enviar_nibble(0x03)
        time.sleep_ms(1)
        self.enviar_nibble(0x02)
        self.comando(0x28)
        self.comando(0x0C)
        self.comando(0x06)
        self.limpar()

    def enviar_nibble(self, valor):
        for i in range(4):
            self.dados[i].value((valor >> i) & 1)
        self.e.value(1)
        time.sleep_us(50)
        self.e.value(0)
        time.sleep_us(50)

    def enviar_byte(self, valor, modo):
        self.rs.value(modo)
        self.enviar_nibble(valor >> 4)
        self.enviar_nibble(valor & 0x0F)

    def comando(self, valor):
        self.enviar_byte(valor, 0)
        time.sleep_ms(2)

    def limpar(self):
        self.comando(0x01)
        time.sleep_ms(2)

    def tirar_acentos(self, texto):
        com = "áàâãäéèêëíìîïóòôõöúùûüçÁÀÂÃÉÊÍÓÔÕÚÇ"
        sem = "aaaaaeeeeiiiiooooouuuucAAAEEIOOOUC"
        resultado = ""
        for letra in texto:
            posicao = com.find(letra)
            if posicao >= 0:
                resultado = resultado + sem[posicao]
            else:
                resultado = resultado + letra
        return resultado

    def escrever_linha(self, linha, texto):
        texto = self.tirar_acentos(texto)
        texto = texto[:16]
        while len(texto) < 16:
            texto = texto + " "
        if linha == 1:
            self.comando(0x80)
        else:
            self.comando(0xC0)
        for letra in texto:
            self.enviar_byte(ord(letra), 1)

    def mostrar(self, linha1, linha2):
        self.escrever_linha(1, linha1)
        self.escrever_linha(2, linha2)
