# El tablero en la nube

Hasta ahora el tablero de mejores puntajes vivía **en el navegador de cada
equipo**. El teléfono de Martín y el portátil de Simón tenían cada uno el suyo,
y ninguno de los dos era *el* tablero. Como del tablero depende el premio de
diciembre, hace falta uno solo, el mismo, que se vea desde cualquier aparato.

Eso es lo que hace esto: una base de datos de Firebase donde se apunta cada
partida, y de la que se bajan las diez mejores.

El juego **ya está listo**. Falta encenderlo, que son cinco minutos y dos
pegadas: la dirección en el código, y el reglamento en Firebase.

---

## 1. Crear la base de datos

1. Entra en <https://console.firebase.google.com> con tu cuenta de siempre.
2. **Agregar proyecto** → llámalo `aventura-martin-simon`. Google Analytics no
   hace falta: dile que no y listo.
3. En el menú de la izquierda: **Compilación → Realtime Database** →
   **Crear base de datos**.
   - Ubicación: la que te ofrezca (`us-central1` está bien).
   - Cuando pregunte por las reglas, elige **modo bloqueado**. Las de verdad se
     pegan en el paso 3.

> Ojo: **Realtime Database**, no *Cloud Firestore*. Son dos productos distintos
> y el juego habla con el primero.

---

## 2. Pegar la dirección en el juego

Arriba de la base de datos, Firebase enseña su dirección. Es algo así:

```
https://aventura-martin-simon-default-rtdb.firebaseio.com
```

(o terminada en `.firebasedatabase.app`, según la región).

Cópiala y pégala en [src/config/nube.js](src/config/nube.js), en la línea de
`DIRECCION`:

```js
const DIRECCION = 'https://aventura-martin-simon-default-rtdb.firebaseio.com';
```

Y ya. No hay nada más que tocar en el código.

---

## 3. Pegar el reglamento en Firebase

En la pestaña **Reglas** de la base de datos, borra lo que haya y pega esto
tal cual. Luego, **Publicar**.

```json
{
  "rules": {
    ".read": false,
    ".write": false,

    "puntajes": {
      ".read": true,
      ".indexOn": "puntos",

      "$partida": {
        ".write": "!data.exists() || newData.child('puntos').val() >= data.child('puntos').val()",
        ".validate": "newData.hasChildren(['nombre', 'puntos', 'fecha']) && $partida.length <= 40",

        "nombre":    { ".validate": "newData.isString() && newData.val().length <= 10" },
        "puntos":    { ".validate": "newData.isNumber() && newData.val() >= 0 && newData.val() <= 99999" },
        "personaje": { ".validate": "newData.isString() && newData.val().length <= 20" },
        "nivel":     { ".validate": "newData.isNumber() && newData.val() >= 1 && newData.val() <= 99" },
        "fecha":     { ".validate": "newData.isNumber() && newData.val() > 0" },

        "$otro":     { ".validate": false }
      }
    }
  }
}
```

Lo que dice el reglamento, en cristiano:

- **Fuera de `puntajes` no se puede ni mirar.** Si algún día esa base guarda
  otra cosa, el juego no la toca.
- Los puntajes **se pueden leer**, que para eso son un tablero.
- Se puede **escribir una partida**, pero solo con la forma exacta de una
  partida: nombre de diez letras como mucho, puntos entre 0 y 99999, nivel del
  1 al 99, y nada más. Cualquier campo que no esté en la lista tumba la
  escritura entera (`$otro`).
- **El puntaje de una partida solo puede subir, nunca bajar.** De paso, eso
  impide borrar filas: quitar una es escribir "nada" donde había puntos.
- `.indexOn` es lo que deja pedirle a Firebase que ordene y recorte él, para
  que el juego se baje diez filas y no mil.

---

## 4. Comprobar que quedó

```bash
npm run dev
```

Juega un mundo. Al acabar, en el panel de victoria tiene que salir
**"Apuntado como NOMBRE · N.º del tablero"**, y en Firebase, dentro de
`puntajes`, tiene que aparecer una fila con un identificador tipo `p2m3x9abc`.

Ábrelo desde el teléfono y el tablero tiene que ser **el mismo**.

---

## Lo que hay que saber

**La dirección va a la vista en el juego publicado.** No es una contraseña, es
la puerta: cualquiera que mire el código del sitio la encuentra. Quien manda es
el reglamento de arriba, que solo deja leer y escribir puntajes y con la forma
que toca. Es lo mismo que hacen todas las apps web con Firebase.

Eso sí: **cualquiera que dé con la dirección puede apuntar un puntaje.** Para un
juego de casa, cuyo enlace no está en ningún sitio, es un riesgo que no existe.
Si algún día apareciera un "JAJAJA 99999" en el tablero, hay dos salidas:
borrarlo a mano desde la consola de Firebase, o crear otra base y cambiar la
dirección. Es la misma decisión que ya está tomada en `CLAUDE.md` con los
rótulos de los fondos: esto es un regalo para Martín y Simón, no un producto.

**Si la nube falla, el juego no se entera.** Sin internet, con el wifi malo o
con Firebase caído, se sigue jugando igual y el tablero que se ve es el del
equipo. Lo que no se pudo subir se queda en una cola y se reintenta la próxima
vez, así que una tarde de juego no se pierde porque se cayera la conexión.

**Sin dirección, todo esto está apagado** y el juego funciona exactamente como
funcionaba antes. Por eso se puede tener el código publicado sin haber creado
todavía la base.

**Las pruebas automáticas nunca tocan la nube.** Abren el juego con `?nube=0`;
si no, cada pasada de `npm run probar` escribiría partidas inventadas en el
tablero de verdad.

## Si hay que empezar de cero

En la consola de Firebase, dentro de `puntajes`, se borra el nodo entero con el
botón de la papelera. El tablero de cada equipo no se borra con eso: para
limpiar uno, en la consola del navegador del juego,
`localStorage.removeItem('aventura-mejores')`.
