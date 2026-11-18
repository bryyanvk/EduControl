
from machine import Pin, SPI
from time import ticks_ms, ticks_add, ticks_diff, sleep_ms
import struct
import Ntw

DHCP_SERVER_PORT = 67
DHCP_CLIENT_PORT = 68

class DHCPClient:

    def __init__(self, ntw):
        self.ntw = ntw
        self.mac = ntw.myMacAddr
        self.xid = ticks_ms() & 0xFFFFFFFF

        self.offer = None
        self.ack = None
        self.nak = False

        self.ntw.registerUdp4BcastCallback(
            DHCP_CLIENT_PORT,
            self.receive
        )

    def build_packet(self, msg_type, requested_ip=None, server_id=None):

        zero = bytes(4)
        chaddr = self.mac + bytes(10)

        bootp = struct.pack(
            "!BBBBIHH4s4s4s4s16s64s128s",
            1, 1, 6, 0,
            self.xid,
            0,
            0x8000,
            zero, zero, zero, zero,
            chaddr,
            bytes(64),
            bytes(128)
        )

        options = bytearray(b"\x63\x82\x53\x63")

        options.extend(bytes([53, 1, msg_type]))

        if requested_ip is not None:
            options.extend(bytes([50, 4]))
            options.extend(requested_ip)

        if server_id is not None:
            options.extend(bytes([54, 4]))
            options.extend(server_id)

        options.extend(bytes([55, 4, 1, 3, 6, 51]))

        options.extend(bytes([61, 7, 1]))
        options.extend(self.mac)

        options.append(255)

        return bootp + options

    def receive(self, pkt):

        if pkt.udp_srcPort != DHCP_SERVER_PORT:
            return

        data = bytes(pkt.udp_data)

        if len(data) < 240:
            return

        if data[0] != 2:
            return

        if struct.unpack_from("!I", data, 4)[0] != self.xid:
            return

        if data[28:34] != self.mac:
            return

        if data[236:240] != b"\x63\x82\x53\x63":
            return

        options = {}
        pos = 240

        while pos < len(data):

            code = data[pos]
            pos += 1

            if code == 255:
                break

            if code == 0:
                continue

            if pos >= len(data):
                break

            length = data[pos]
            pos += 1

            if pos + length > len(data):
                break

            options[code] = data[pos:pos + length]
            pos += length

        if 53 not in options:
            return

        message_type = options[53][0]

        response = {
            "ip": data[16:20],
            "options": options
        }

        if message_type == 2:
            self.offer = response
            print("DHCP OFFER recebido!")

        elif message_type == 5:
            self.ack = response
            print("DHCP ACK recebido!")

        elif message_type == 6:
            self.nak = True
            print("DHCP NAK recebido!")

    def wait_response(self, attribute, timeout=10):

        deadline = ticks_add(ticks_ms(), timeout * 1000)

        while ticks_diff(deadline, ticks_ms()) > 0:

            self.ntw.rxAllPkt()

            if getattr(self, attribute) is not None:
                return getattr(self, attribute)

            if self.nak:
                return None

            sleep_ms(10)

        return None

    def start(self):

        print("\nEnviando DHCP DISCOVER...")

        discover = self.build_packet(1)

        for attempt in range(3):

            self.ntw.sendUdp4Bcast(
                DHCP_SERVER_PORT,
                DHCP_CLIENT_PORT,
                discover
            )

            self.offer = None

            offer = self.wait_response("offer", 10)

            if offer is not None:
                break

            print("Nenhuma oferta. Tentativa:", attempt + 1)

        if offer is None:
            print("Erro: nenhum servidor DHCP respondeu.")
            return False

        options = offer["options"]

        server_id = options.get(54)

        if server_id is None:
            print("Erro: servidor não informou seu identificador.")
            return False

        print("IP oferecido:", ".".join(map(str, offer["ip"])))

        print("\nEnviando DHCP REQUEST...")

        request = self.build_packet(
            3,
            offer["ip"],
            server_id
        )

        self.ack = None
        self.nak = False

        self.ntw.sendUdp4Bcast(
            DHCP_SERVER_PORT,
            DHCP_CLIENT_PORT,
            request
        )

        ack = self.wait_response("ack", 10)

        if ack is None:
            print("Erro: não recebemos DHCP ACK.")
            return False

        options = ack["options"]

        ip = ack["ip"]
        mask = options.get(1, bytes(4))
        gateway = options.get(3, bytes(4))
        dns = options.get(6)

        self.ntw.setIPv4(ip, mask, gateway)

        if dns is not None and len(dns) >= 4:
            self.ntw.setDnsSrvIpv4(dns[:4])

        print("\n================================")
        print(" EDUCONTROL - DHCP CONECTADO")
        print("================================")

        print("IP:", ".".join(map(str, ip)))
        print("Mascara:", ".".join(map(str, mask)))
        print("Gateway:", ".".join(map(str, gateway)))

        if dns is not None:
            print("DNS:", ".".join(map(str, dns[:4])))

        print("================================")

        return True


def iniciar_dhcp():

    print("Iniciando EDUCONTROL DHCP CLIENT...")

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

    client = DHCPClient(ntw)

    if not client.start():
        raise RuntimeError("Falha no DHCP")

    while True:
        ntw.rxAllPkt()
        sleep_ms(10)


if __name__ == "__main__":
    iniciar_dhcp()
