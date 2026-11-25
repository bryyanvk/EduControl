
import socket

IP = "0.0.0.0"
PORTA = 5005

servidor = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
servidor.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)

servidor.bind((IP, PORTA))

print("================================")
print(" EDUCONTROL - SERVIDOR UDP")
print("================================")
print("Servidor iniciado!")
print("IP de escuta:", IP)
print("Porta:", PORTA)
print("Aguardando mensagens...")

while True:
    mensagem, endereco = servidor.recvfrom(1024)

    print("\nMensagem recebida!")
    print("Origem:", endereco)
    print("Conteudo:", mensagem.decode("utf-8", errors="replace"))

    resposta = "EDUCONTROL_ACK: mensagem recebida!"

    servidor.sendto(resposta.encode("utf-8"), endereco)

    print("Resposta enviada!")
