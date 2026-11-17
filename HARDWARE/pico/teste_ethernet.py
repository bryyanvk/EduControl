from machine import Pin, SPI
from time import sleep

# ENC28J60 - Raspberry Pi Pico 2
spi = SPI(
    1,
    baudrate=2000000,
    polarity=0,
    phase=0,
    sck=Pin(14),
    mosi=Pin(15),
    miso=Pin(12)
)

cs = Pin(13, Pin.OUT, value=1)
rst = Pin(10, Pin.OUT, value=1)

def selecionar():
    cs.value(0)

def liberar():
    cs.value(1)

def escrever_registro(endereco, valor):
    selecionar()
    spi.write(bytes([0x40 | (endereco & 0x1F), valor]))
    liberar()

def ler_registro(endereco):
    selecionar()
    spi.write(bytes([endereco & 0x1F]))
    valor = spi.read(1)[0]
    liberar()
    return valor

print("Iniciando teste ENC28J60...")

# Reset do controlador
rst.value(0)
sleep(0.1)
rst.value(1)
sleep(0.5)

# Seleciona banco 3
escrever_registro(0x1F, 0x03)

# Leitura do registrador de identificação
revisao = ler_registro(0x12)

print("Revisao do ENC28J60:", hex(revisao))

if revisao not in (0x00, 0xFF):
    print("Comunicacao SPI funcionando!")
else:
    print("Falha na comunicacao. Verificar conexao.")
