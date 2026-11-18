
from machine import Pin, SPI
import Ntw
import time

spi = SPI(
    1,
    baudrate=2000000,
    sck=Pin(14),
    mosi=Pin(15),
    miso=Pin(12)
)

cs = Pin(13)

ntw = Ntw.Ntw(spi, cs)

print("\nDiagnostico Ethernet")

for i in range(5):
    phstat1 = ntw.nic.ReadPhyReg(0x01)
    phstat2 = ntw.nic.ReadPhyReg(0x11)

    print("PHSTAT1:", hex(phstat1))
    print("PHSTAT2:", hex(phstat2))
    print("Link:", ntw.isLinkUp())

    time.sleep(1)
