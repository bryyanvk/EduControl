
from time import ticks_ms, ticks_add, ticks_diff, sleep_ms
import struct

from dhcp_client import iniciar_dhcp


# ==========================================
# CONFIGURACAO EDUCONTROL
# ==========================================

IP_SERVIDOR = bytes([172, 16, 30, 21])
PORTA_SERVIDOR = 8080
PORTA_LOCAL = 40001

UID_TESTE = "TESTE_RFID_001"

TCP_SYN = 0x02
TCP_ACK = 0x10
TCP_PSH = 0x08
TCP_FIN = 0x01
TCP_RST = 0x04


class ClienteHTTP:

    def __init__(self, ntw):

        self.ntw = ntw

        self.seq = ticks_ms() & 0xFFFFFFFF
        self.ack = 0

        self.estado = "INICIAL"

        self.resposta = bytearray()

        self.erro = None
        self.finalizado = False

    def enviar(self, dados=b"", flags=TCP_ACK):

        return self.ntw.sendTcp4(
            IP_SERVIDOR,
            PORTA_SERVIDOR,
            PORTA_LOCAL,
            dados,
            self.seq,
            self.ack,
            flags
        )

    def receber(self, pkt):

        if pkt.ip_src_addr != IP_SERVIDOR:
            return

        if pkt.tcp_srcPort != PORTA_SERVIDOR:
            return

        flags = pkt.tcp_flags

        # ----------------------------------
        # RESET
        # ----------------------------------

        if flags & TCP_RST:

            self.erro = "Servidor recusou a conexao TCP."
            return

        # ----------------------------------
        # RESPOSTA AO SYN
        # ----------------------------------

        if self.estado == "SYN_ENVIADO":

            if (flags & TCP_SYN) and (flags & TCP_ACK):

                if pkt.tcp_ack_num != self.seq + 1:
                    return

                self.ack = (pkt.tcp_seq_num + 1) & 0xFFFFFFFF
                self.seq = (self.seq + 1) & 0xFFFFFFFF

                self.enviar(flags=TCP_ACK)

                self.estado = "CONECTADO"

                print("[TCP] Conexao estabelecida!")

            return

        # ----------------------------------
        # DADOS HTTP
        # ----------------------------------

        if self.estado not in ("CONECTADO", "RECEBENDO"):
            return

        dados = bytes(pkt.tcp_data)

        if dados:

            if pkt.tcp_seq_num == self.ack:

                self.resposta.extend(dados)

                self.ack = (
                    self.ack + len(dados)
                ) & 0xFFFFFFFF

                self.estado = "RECEBENDO"

                print("[HTTP] Recebidos", len(dados), "bytes")

            # Confirma os dados recebidos.
            self.enviar(flags=TCP_ACK)

        # ----------------------------------
        # ENCERRAMENTO DO SERVIDOR
        # ----------------------------------

        if flags & TCP_FIN:

            if pkt.tcp_seq_num + len(dados) == self.ack:
                self.ack = (self.ack + 1) & 0xFFFFFFFF

            self.enviar(flags=TCP_ACK)

            self.finalizado = True
            self.estado = "FINALIZADO"

            print("[TCP] Servidor encerrou a conexao.")

    def aguardar_arp(self):

        print("\n[TCP] Procurando MAC do servidor...")

        self.ntw.connectIp4(IP_SERVIDOR)

        prazo = ticks_add(ticks_ms(), 5000)

        while ticks_diff(prazo, ticks_ms()) > 0:

            self.ntw.rxAllPkt()

            if self.ntw.getArpEntry(IP_SERVIDOR) is not None:
                print("[ARP] Servidor encontrado!")
                return True

            sleep_ms(10)

        print("[ARP] Nao foi possivel encontrar o servidor.")
        return False

    def conectar(self):

        if not self.aguardar_arp():
            return False

        print("\n[TCP] Enviando SYN...")

        self.estado = "SYN_ENVIADO"

        resultado = self.enviar(flags=TCP_SYN)

        if resultado < 0:
            print("[TCP] Falha ao enviar SYN.")
            return False

        prazo = ticks_add(ticks_ms(), 8000)

        while ticks_diff(prazo, ticks_ms()) > 0:

            self.ntw.rxAllPkt()

            if self.estado == "CONECTADO":
                return True

            if self.erro:
                print(self.erro)
                return False

            sleep_ms(10)

        print("[TCP] Timeout aguardando SYN-ACK.")
        return False

    def enviar_http(self, uid):

        corpo = '{"uid":"' + uid + '"}'

        requisicao = (
            "POST /edu/rfid HTTP/1.1\r\n"
            "Host: 172.16.30.21:8080\r\n"
            "Content-Type: application/json\r\n"
            "Content-Length: {}\r\n"
            "Connection: close\r\n"
            "\r\n"
            "{}"
        ).format(len(corpo), corpo)

        dados = requisicao.encode()

        print("\n[HTTP] Enviando UID:", uid)

        resultado = self.enviar(
            dados=dados,
            flags=TCP_ACK | TCP_PSH
        )

        if resultado < 0:
            print("[HTTP] Falha no envio.")
            return False

        self.seq = (self.seq + len(dados)) & 0xFFFFFFFF

        self.estado = "RECEBENDO"

        return True

    def aguardar_resposta(self):

        print("\n[HTTP] Aguardando resposta do Spring Boot...")

        prazo = ticks_add(ticks_ms(), 10000)

        while ticks_diff(prazo, ticks_ms()) > 0:

            self.ntw.rxAllPkt()

            if self.erro:
                print(self.erro)
                return

            if self.finalizado:
                break

            sleep_ms(10)

        print("\n========== RESPOSTA HTTP ==========")

        if self.resposta:

            print(bytes(self.resposta).decode("utf-8", "replace"))

        else:

            print("Nenhuma resposta HTTP recebida.")

        print("===================================")


# ==========================================
# EXECUCAO
# ==========================================

def main():

    print("================================")
    print(" EDUCONTROL - TESTE HTTP")
    print("================================")

    ntw = iniciar_dhcp()

    cliente = ClienteHTTP(ntw)

    if not cliente.conectar():
        print("\nFalha ao estabelecer conexao.")
        return

    if not cliente.enviar_http(UID_TESTE):
        return

    cliente.aguardar_resposta()

    print("\nTeste finalizado.")


if __name__ == "__main__":
    main()
