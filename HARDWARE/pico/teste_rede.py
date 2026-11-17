
from machine import Pin, SPI
from time import sleep
import enc28j60

print("================================")
print(" EDUCONTROL - TESTE ETHERNET")
print("================================")

# Configuracao SPI1
spi = SPI(
    1,
    baudrate=2000000,
    polarity=0,
    phase=0,
    sck=Pin(14),
    mosi=Pin(15),
    miso=Pin(12)
)

# Pinos do ENC28J60
cs = Pin(13, Pin.OUT, value=1)

# Inicializacao do controlador
print("\nInicializando ENC28J60...")

ethernet = enc28j60.ENC28J60(
    spi,
    cs
)

ethernet.init()

sleep(1)

# Identificacao do chip
revisao = ethernet.GetRevId()

print("Revisao do chip:", hex(revisao))

# Endereco MAC
mac = ethernet.getMacAddr()

mac_formatado = ":".join(
    "{:02X}".format(byte)
    for byte in mac
)

print("Endereco MAC:", mac_formatado)

# Verificacao do link fisico
print("\nVerificando cabo Ethernet...")

sleep(2)

if ethernet.IsLinkUp():
    print("STATUS: CABO CONECTADO!")
    print("Link Ethernet ativo.")
else:
    print("STATUS: SEM CONEXAO")
    print("Verifique o cabo e o roteador.")

print("\n================================")
print(" TESTE FINALIZADO")
print("================================")
