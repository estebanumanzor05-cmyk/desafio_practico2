# Sivar Tours · Reservas

Aplicación web para reservar tours de turismo interno en El Salvador. Es una ampliación del sitio estático del Desafío Práctico I. Ahora tiene cuentas de usuario, roles, reservas y un panel de administración, todo sobre Firebase.

**URL publicada:** `https://PEGAR_PROYECTO.web.app` *(se actualiza después del despliegue)*

## Problema que resuelve

Las agencias pequeñas suelen manejar sus reservas por WhatsApp o en hojas de cálculo, así que se pierden cupos, se venden más espacios de los que existen y el cliente no sabe si su reserva quedó confirmada.

Sivar Tours resuelve esto así:

- Publica el catálogo de tours con sus cupos reales.
- Deja que el cliente reserve y vea el estado de su reserva.
- Permite al administrador confirmar o rechazar reservas. Los cupos se descuentan solos y nunca bajan de cero.

## Roles

| Rol | Qué puede hacer |
|---|---|
| **Visitante** (sin sesión) | Ver y filtrar el catálogo. Para reservar se le pide iniciar sesión. |
| **Cliente** | Registrarse, reservar tours, ver sus propias reservas y cancelarlas mientras estén pendientes. |
| **Administrador** | Hacer el CRUD completo de tours, activarlos o desactivarlos, confirmar o rechazar reservas, ver indicadores y cargar los datos iniciales. |

Toda cuenta nueva se crea con rol `cliente`. Las reglas de Firestore impiden que un usuario se asigne `admin`; ese rol solo se cambia desde la consola de Firebase.

## Entidades (Cloud Firestore)

- **usuarios/{uid}**: `nombre`, `correo`, `telefono`, `rol`, `creado`
- **tours/{id}**: `titulo`, `departamento`, `descripcion`, `fecha`, `horario`, `puntoSalida`, `precio`, `cupos`, `cuposDisponibles`, `imagen`, `activo`, `actualizado`
- **reservas/{id}**: `uid`, `nombreCliente`, `correoCliente`, `tourId`, `tourTitulo`, `tourFecha`, `personas`, `precioUnitario`, `total`, `estado`, `creada`, `actualizada`

Relaciones: una reserva pertenece a un usuario (`uid`) y a un tour (`tourId`).

Estados de una reserva: `pendiente`, luego `confirmada`, `rechazada` o `cancelada`.

## Procesos principales

1. **Registro e inicio de sesión** con Firebase Authentication (correo y contraseña).
2. **Catálogo:**
   - Búsqueda por texto, sin importar las tildes.
   - Filtro por departamento y por "solo con cupos".
   - Ordenamiento por fecha, precio o cupos.
3. **Reserva:**
   - El cliente elige el número de personas (de 1 a 10) y ve el total en vivo.
   - La reserva queda `pendiente`.
4. **Confirmación:**
   - El administrador confirma la reserva.
   - Una transacción revisa los cupos y los descuenta del tour.
5. **Cancelación o rechazo**, solo mientras la reserva está pendiente.
6. **CRUD de tours:**
   - Al editar, no se permite dejar menos cupos de los ya reservados.
   - No se puede eliminar un tour con reservas activas.
7. **Indicadores:**
   - Reservas por estado.
   - Ingresos y personas confirmadas.
   - Porcentaje de ocupación por tour.

## Procesamiento de datos con JavaScript

Está en `public/js/utils/procesamiento.js`:

- `filtrarTours` y `ordenarTours`: búsqueda, filtros y orden del catálogo.
- `filtrarPorEstado` y `ordenarReservasRecientes`: listas de reservas.
- `contarPorEstado` y `calcularIndicadores`: totales, ingresos y ocupación, usando `reduce`, `map`, `filter` y `sort`.

## Seguridad

- `firestore.rules` valida en el servidor:
  - Rol, dueño del documento y campos permitidos.
  - Rangos de precio y cupos.
  - Que el precio y el total de una reserva coincidan con el tour.
  - Que no se reserven más personas que los cupos disponibles.
  - Las transiciones de estado permitidas.
- No hay contraseñas, cuentas de servicio ni claves privadas en el repositorio.
- La configuración web de Firebase (`apiKey`, etc.) es pública por diseño. La protección real está en las reglas.
- Las credenciales de prueba se entregan por Moodle.

## Tecnologías

- HTML5, CSS3 (Grid, Flexbox, media queries) y JavaScript nativo con módulos ES.
- Firebase JS SDK 10 modular, cargado por CDN:
  - Authentication
  - Cloud Firestore (consultas, transacciones y `writeBatch`)
  - Hosting
- `async/await` con `try/catch`, y estados de carga, vacío, éxito y error.

## Estructura

```
firebase.json          firestore.rules        firestore.indexes.json
public/
  index.html  login.html  registro.html  mis-reservas.html  admin.html
  css/estilos.css
  js/firebase.js                 configuración de Firebase
  js/servicios/                  auth, tours, reservas, datos-iniciales
  js/utils/                      formato, validaciones, procesamiento
  js/ui/comun.js                 menú, avisos, errores, protección de páginas
  js/paginas/                    un archivo por página
  js/datos/tours-iniciales.js    28 tours de semilla
```

## Cómo ejecutarlo y probarlo

1. Clonar el repositorio.
2. En `public/js/firebase.js`, pegar la configuración web del proyecto de Firebase. En `.firebaserc`, poner el id del proyecto.
3. Instalar la CLI, iniciar sesión y desplegar:

   ```
   npm install -g firebase-tools
   firebase login
   firebase deploy
   ```

   Para probar en local: `firebase serve` o `npx serve public`.
4. Entrar con la cuenta de administrador (datos en Moodle). En **Administración → Tours**, presionar **Cargar datos iniciales**.

### Casos de prueba sugeridos

- Registrarse con datos inválidos; aparecen mensajes por campo.
- Como cliente, abrir `admin.html`; redirige al catálogo con un aviso.
- Buscar "volcan" o filtrar por Santa Ana; cambia la lista y el contador.
- Reservar 3 personas; el total se calcula y la reserva aparece como pendiente en **Mis reservas**.
- Como admin, confirmar esa reserva; los cupos del tour bajan.
- Como admin, intentar bajar los cupos de un tour por debajo de los reservados; se muestra un error.
- Como cliente, cancelar una reserva pendiente.
- Revisar **Indicadores**.
- Ver el sitio en el celular.

## Integrantes

- Integrante 1: Esteban
- Integrante 2:
- Integrante 3:
