import json
import time
import serial
import requests

PORTA = "COM5"
URL_BACK = "http://localhost:8080/edu"
ARQUIVO = "leituras.json"


def salvar_leitura(uid, hora, resposta):
    try:
        arquivo = open(ARQUIVO, "r", encoding="utf-8")
        leituras = json.load(arquivo)
        arquivo.close()
    except:
        leituras = []
    leituras.append({"uid": uid, "hora": hora, "resposta": resposta})
    arquivo = open(ARQUIVO, "w", encoding="utf-8")
    json.dump(leituras, arquivo, ensure_ascii=False, indent=2)
    arquivo.close()


def chamar_back(uid):
    try:
        verificar = requests.get(URL_BACK + "/verificar/" + uid, timeout=5)
        texto = verificar.text.strip()
        print("verificar:", texto)
        registrar = requests.get(URL_BACK + "/reg/" + uid, timeout=5)
        texto = registrar.text.strip()
        print("reg:", texto)
        return texto
    except Exception as erro:
        print("erro no back:", erro)
        return "ERRO"


placa = serial.Serial(PORTA, 115200, timeout=1)
print("Ponte ligada na porta", PORTA)

while True:
    linha = placa.readline().decode("utf-8", errors="ignore").strip()
    if linha == "":
        continue
    print("recebido:", linha)
    if not linha.startswith("{"):
        continue
    try:
        dados = json.loads(linha)
    except:
        continue
    uid = dados["uid"]
    hora = time.strftime("%H:%M:%S")

    resposta = chamar_back(uid)
    salvar_leitura(uid, hora, resposta)

    if resposta == "ERRO":
        mensagem = "Erro|Falha no sistema"
    else:
        mensagem = resposta[:16] + "|" + hora
    placa.write((mensagem + "\n").encode("utf-8"))
