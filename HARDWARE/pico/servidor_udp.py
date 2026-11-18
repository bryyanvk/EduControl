
import socket

IP = "172.16.30.21"
PORTA = 5005

servidor = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
servidor.bind((IP, PORTA))

print("================================")
print(" EDUCONTROL - SERVIDOR UDP")
print("================================")
print("Aguardando mensagens...")
print("IP:", IP)
print("Porta:", PORTA)

while True:
    mensagem, endereco = servidor.recvfrom(1024)

    print("\nMensagem recebida!")
    print("Origem:", endereco)
    print("Conteudo:", mensagem.decode("utf-8", errors="replace"))

    resposta = "EDUCONTROL_ACK: mensagem recebida!"
    servidor.sendto(resposta.encode(), endereco)

    print("Resposta enviada!")

