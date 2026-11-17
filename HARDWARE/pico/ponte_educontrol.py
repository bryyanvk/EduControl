
import socket
import json
import urllib.request
import urllib.error

IP = "0.0.0.0"
PORTA_UDP = 5005

URL_BACKEND = "http://localhost:8080/edu/rfid"

servidor = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
servidor.bind((IP, PORTA_UDP))

print("================================")
print(" EDUCONTROL - PONTE UDP / JAVA")
print("================================")
print("Aguardando Raspberry Pi Pico...")
print("Backend:", URL_BACKEND)

while True:
    dados, endereco = servidor.recvfrom(1024)

    try:
        mensagem = json.loads(dados.decode())

        uid = mensagem.get("uid")

        if not uid:
            resposta = "ERRO: UID nao informado"
        else:
            corpo = json.dumps(mensagem).encode("utf-8")

            requisicao = urllib.request.Request(
                URL_BACKEND,
                data=corpo,
                headers={"Content-Type": "application/json"},
                method="POST"
            )

            with urllib.request.urlopen(requisicao, timeout=5) as resposta_http:
                resposta = resposta_http.read().decode("utf-8")

        print("\nPresenca recebida!")
        print("UID:", uid)
        print("Backend:", resposta)

    except urllib.error.HTTPError as erro:
        resposta = "ERRO HTTP: " + str(erro.code)
        print(resposta)

    except Exception as erro:
        resposta = "ERRO: " + str(erro)
        print(resposta)

    servidor.sendto(resposta.encode("utf-8"), endereco)
