import time
from lcd1602 import LCD

lcd = LCD(16, 17, 18, 19, 20, 21)

lcd.mostrar("EduControl", "LCD funcionando")
time.sleep(3)

contador = 0
while True:
    lcd.mostrar("Contador:", str(contador))
    contador = contador + 1
    time.sleep(1)
