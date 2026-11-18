
from machine import Pin, SPI
from time import ticks_ms, ticks_add, ticks_diff, sleep_ms

import Ntw
from dhcp import DHCPClient

IP_SERVIDOR = bytes([172, 16, 30, 19])
PORTA_SERVIDOR = 5005
PORTA_CLIENTE = 5006


def receber_resposta(pkt):
    mensagem = bytes(pkt.udp_data)

    print("\nResposta recebida do notebook:")
    print(mensagem.decode("utf-8"))


print("================================")
print(" EDUCONTROL - CLIENTE UDP")
print("================================")

spi = SPI(
    1,
    baudrate=2000000,
    sck=Pin(14),
    mosi=Pin(15),
    miso=Pin(12)
)

cs = Pin(13)

ntw = Ntw.Ntw(spi, cs)

print("Aguardando link Ethernet...")

deadline = ticks_add(ticks_ms(), 15000)

while not ntw.isLinkUp():

    if ticks_diff(deadline, ticks_ms()) <= 0:
        raise RuntimeError("Ethernet desconectada")

    sleep_ms(500)

print("Ethernet conectada!")

print("\nSolicitando IP pelo DHCP...")

dhcp = DHCPClient(ntw)

if not dhcp.start():
    raise RuntimeError("Falha ao obter IP pelo DHCP")

ntw.registerUdp4Callback(
    PORTA_CLIENTE,
    receber_resposta
)

print("\nConfigurando comunicacao UDP...")

ntw.connectIp4(IP_SERVIDOR)

deadline = ticks_add(ticks_ms(), 10000)

while not ntw.isConnectedIp4(IP_SERVIDOR):

    ntw.rxAllPkt()

    if ticks_diff(deadline, ticks_ms()) <= 0:
        raise RuntimeError("Nao foi possivel resolver o endereco ARP")

    sleep_ms(50)

print("Endereco de destino resolvido!")

mensagem = b"EDUCONTROL: Raspberry Pi Pico conectado!"

print("\nEnviando mensagem UDP...")

resultado = ntw.sendUdp4(
    IP_SERVIDOR,
    PORTA_SERVIDOR,
    mensagem,
    src_port=PORTA_CLIENTE
)

print("Resultado do envio:", resultado)
print("Aguardando resposta do notebook...")

while True:
    ntw.rxAllPkt()
    sleep_ms(10)
