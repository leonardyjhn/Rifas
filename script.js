const firebaseConfig = {
  apiKey: "AIzaSyBfiL057BQQf0vpcN1LoLGnlyktfvsNHiw",
  authDomain: "rifasleosoc.firebaseapp.com",
  projectId: "rifasleosoc",
  storageBucket: "rifasleosoc.appspot.com",
  messagingSenderId: "4575769760",
  appId: "1:4575769760:web:5530d10bf0cde3a55ec5c5"
};

// Inicializar Firebase
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const auth = firebase.auth();

// Configuración especial para desarrollo
db.settings({
  cacheSizeBytes: firebase.firestore.CACHE_SIZE_UNLIMITED
});

db.enablePersistence()
  .catch((err) => {
      console.error("Error al habilitar persistencia:", err);
  });

// Variables globales
let rifas = [];
let clientes = [];
let rifaActiva = null;
let superusuarioActivo = false;
let superusuarioTimeout = null;
let modoPrueba = false;
let fechaInicioPrueba = null;
let filtroClientes = 'todos';
let codigosFirebase = []; // Para almacenar códigos sincronizados
let codigosUsados = [];

// Elementos del DOM
const accesoContainer = document.getElementById('acceso-container');
const mainContainer = document.getElementById('main-container');
const codigoAccesoInput = document.getElementById('codigo-acceso');
const btnAcceder = document.getElementById('btn-acceder');
const btnPrueba = document.getElementById('btn-prueba');
const btnSuperusuario = document.getElementById('btn-superusuario');
const btnContacto = document.getElementById('btn-contacto');
const btnRifas = document.getElementById('btn-rifas');
const btnClientes = document.getElementById('btn-clientes');
const btnRespaldo = document.getElementById('btn-respaldo');
const btnSeguridad = document.getElementById('btn-seguridad');
const btnSalir = document.getElementById('btn-salir');
const rifasSection = document.getElementById('rifas-section');
const clientesSection = document.getElementById('clientes-section');
const respaldoSection = document.getElementById('respaldo-section');
const seguridadSection = document.getElementById('seguridad-section');
const rifaActivaInfo = document.getElementById('rifa-activa-info');
const btnCambiarNombre = document.getElementById('btn-cambiar-nombre');
const nombreModal = document.getElementById('nombre-modal');
const appTitle = document.getElementById('app-title');
const plantillaTicketModal = document.getElementById('plantilla-ticket-modal');

// Modales
const superusuarioModal = document.getElementById('superusuario-modal');
const cuadriculaModal = document.getElementById('cuadricula-modal');
const clienteModal = document.getElementById('cliente-modal');
const plantillaModal = document.getElementById('plantilla-modal');
const rifaModal = document.getElementById('rifa-modal');
const seguridadModal = document.getElementById('seguridad-modal');
const confirmacionModal = document.getElementById('confirmacion-modal');

// Cargar datos al iniciar
document.addEventListener('DOMContentLoaded', () => {
    cargarDatos();
    configurarEventos();
    verificarPrueba();
    iniciarFirebase();
});

// Función para iniciar Firebase y sincronizar códigos
function iniciarFirebase() {
    console.log("Inicializando Firebase...");
    
    // Verificar si Firebase ya está inicializado
    if (!firebase.apps.length) {
        console.log("Configurando Firebase por primera vez");
        firebase.initializeApp(firebaseConfig);
    }

    // Probar la conexión a Firestore
    db.collection("codigos").get()
        .then(() => console.log("Conexión a Firestore exitosa"))
        .catch(error => console.error("Error conectando a Firestore:", error));

    // Escuchar cambios en la colección de códigos
    db.collection("codigos").onSnapshot(
        (snapshot) => {
            console.log("Datos recibidos de Firestore");
            codigosFirebase = [];
            snapshot.forEach((doc) => {
                codigosFirebase.push(doc.data());
            });
            
            if (!seguridadSection.classList.contains('hidden')) {
                mostrarSeguridad();
            }
        },
        (error) => {
            console.error("Error en la suscripción a Firestore:", error);
            alert("Error de conexión con la base de datos. Intenta recargar la página.");
        }
    );
}

function cargarDatos() {
    // Cargar nombre de la app
    const nombreGuardado = localStorage.getItem('nombreApp');
    if (nombreGuardado) {
        appTitle.textContent = nombreGuardado;
        document.querySelector('#acceso-container h1').textContent = nombreGuardado;
    }
    
    // Cargar datos del localStorage
    const rifasGuardadas = localStorage.getItem('rifasSucre_rifas');
const clientesGuardados = localStorage.getItem('rifasSucre_clientes');
const codigosGuardados = localStorage.getItem('rifasSucre_codigos');
const plantillaGuardada = localStorage.getItem('rifasSucre_plantilla');
const pruebaGuardada = localStorage.getItem('rifasSucre_prueba');
const codigosValidosGuardados = localStorage.getItem('rifasSucre_codigosValidos');

if (rifasGuardadas) rifas = JSON.parse(rifasGuardadas);
if (clientesGuardados) clientes = JSON.parse(clientesGuardados);
if (codigosGuardados) codigosUsados = JSON.parse(codigosGuardados); // Esta línea cambia
if (codigosValidosGuardados) localStorage.setItem('rifasSucre_codigosValidos', codigosValidosGuardados);
    
    // Cargar plantilla por defecto si no existe
    if (!plantillaGuardada) {
        const plantillaDefault = `¡Hola {nombre}!

Gracias por participar en la rifa "{rifa}".
Números asignados: {numeros}
Estado: {estado}

Por favor, completa tu pago si aún no lo has hecho. ¡Mucha suerte!`;
        localStorage.setItem('rifasSucre_plantilla', plantillaDefault);
    }
    
    // Cargar datos de prueba
    if (pruebaGuardada) {
        const pruebaData = JSON.parse(pruebaGuardada);
        modoPrueba = true;
        fechaInicioPrueba = new Date(pruebaData.fechaInicio);
    }
    
    // Mostrar pantalla de acceso
    accesoContainer.classList.remove('hidden');
    mainContainer.classList.add('hidden');
}

function configurarEventos() {
    // Acceso
    btnAcceder.addEventListener('click', validarAcceso);
    btnPrueba.addEventListener('click', activarPrueba);
    btnSuperusuario.addEventListener('click', mostrarModalSuperusuario);
    btnContacto.addEventListener('click', () => {
        window.open('https://wa.me/584245244171', '_blank');
    });
    
    // Menú principal
    btnRifas.addEventListener('click', () => mostrarSeccion('rifas'));
    btnClientes.addEventListener('click', () => mostrarSeccion('clientes'));
    btnRespaldo.addEventListener('click', () => mostrarSeccion('respaldo'));
    btnSeguridad.addEventListener('click', () => mostrarSeccion('seguridad'));
    btnSalir.addEventListener('click', salir);
    btnCambiarNombre.addEventListener('click', mostrarModalCambiarNombre);
    
    // Modales
    document.querySelectorAll('.close-modal').forEach(btn => {
        btn.addEventListener('click', () => {
            btn.closest('.modal').classList.add('hidden');
        });
    });
    
    // Superusuario
    document.getElementById('btn-superusuario-acceder').addEventListener('click', validarSuperusuario);
    
    // Eventos de teclado
    codigoAccesoInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') validarAcceso();
    });
    
    document.getElementById('superusuario-clave').addEventListener('keypress', (e) => {
        if (e.key === 'Enter') validarSuperusuario();
    });
    
    // Cambiar nombre
    document.getElementById('btn-guardar-nombre').addEventListener('click', guardarNuevoNombre);
    
    // Seguridad
    document.getElementById('btn-generar-codigo').addEventListener('click', generarCodigoAcceso);
    
    // Plantilla ticket
    document.getElementById('btn-guardar-plantilla-ticket').addEventListener('click', guardarPlantillaTicket);
}

function mostrarModalCambiarNombre() {
    document.getElementById('nuevo-nombre').value = localStorage.getItem('nombreApp') || 'Rifas Sucre';
    nombreModal.classList.remove('hidden');
}

function guardarNuevoNombre() {
    const nuevoNombre = document.getElementById('nuevo-nombre').value.trim();
    if (!nuevoNombre) {
        alert('Por favor ingresa un nombre válido');
        return;
    }
    
    localStorage.setItem('nombreApp', nuevoNombre);
    appTitle.textContent = nuevoNombre;
    nombreModal.classList.add('hidden');
    document.querySelector('#acceso-container h1').textContent = nuevoNombre;
}

async function validarAcceso() {
    console.log("[ValidarAcceso 1] Iniciando proceso de acceso");
    
    const codigo = codigoAccesoInput.value.trim();
    console.log("[ValidarAcceso 2] Código ingresado:", codigo);

    // 1. Validación básica
    if (codigo.length !== 8 || !/^\d+$/.test(codigo)) {
        alert('El código debe tener exactamente 8 dígitos');
        return;
    }

    // 2. Verificar códigos usados localmente
    const codigosUsados = JSON.parse(localStorage.getItem('rifasSucre_codigos') || "[]");
    console.log("[ValidarAcceso 3] Códigos usados localmente:", codigosUsados);
    
    if (codigosUsados.includes(codigo)) {
        console.log("[ValidarAcceso 4] Código encontrado en almacenamiento local");
        accesoContainer.classList.add('hidden');
        mainContainer.classList.remove('hidden');
        mostrarSeccion('rifas');
        return;
    }

    // 3. Verificar modo prueba
    if (modoPrueba && calcularDiasRestantesPrueba() > 0) {
        console.log("[ValidarAcceso 5] Acceso por modo prueba");
        accesoContainer.classList.add('hidden');
        mainContainer.classList.remove('hidden');
        mostrarSeccion('rifas');
        return;
    }

    // 4. Verificar superusuario
    if (superusuarioActivo) {
        console.log("[ValidarAcceso 6] Acceso como superusuario");
        accesoContainer.classList.add('hidden');
        mainContainer.classList.remove('hidden');
        mostrarSeccion('rifas');
        return;
    }

    // 5. Validar con Firebase
    console.log("[ValidarAcceso 7] Validando con Firebase...");
    try {
        const codigoValido = await verificarCodigo(codigo);
        console.log("[ValidarAcceso 8] Resultado de verificación:", codigoValido);
        
        if (codigoValido) {
            console.log("[ValidarAcceso 9] Acceso concedido");
            accesoContainer.classList.add('hidden');
            mainContainer.classList.remove('hidden');
            mostrarSeccion('rifas');
        } else {
            console.log("[ValidarAcceso 10] Acceso denegado");
            alert('Código inválido o expirado. Por favor, adquiere un nuevo código de acceso.');
        }
    } catch (error) {
        console.error("[ValidarAcceso ERROR]", error);
        alert("Ocurrió un error inesperado. Por favor intenta nuevamente.");
    }
}

// Función para verificar si un código es válido (sincronizado con Firebase)
async function verificarCodigo(codigo) {
    console.log("[1] Iniciando verificación de código:", codigo);
    
    try {
        // 1. Validación básica del formato
        if (typeof codigo !== 'string') codigo = codigo.toString();
        codigo = codigo.trim();
        
        if (codigo.length !== 8 || !/^\d+$/.test(codigo)) {
            console.log("[2] Formato de código inválido");
            return false;
        }

        console.log("[3] Buscando código en Firestore...");
        
        // 2. Buscar el código en Firestore
        const querySnapshot = await db.collection("codigos")
            .where("codigo", "==", codigo)
            .limit(1)
            .get();

        if (querySnapshot.empty) {
            console.log("[4] Código no encontrado en Firestore");
            return false;
        }

        const doc = querySnapshot.docs[0];
        const codigoData = doc.data();
        console.log("[5] Datos del código:", codigoData);

        // 3. Verificar expiración
        const ahora = new Date();
        const fechaExpiracion = new Date(codigoData.expiracion);
        
        if (ahora > fechaExpiracion) {
            console.log("[6] Código expirado");
            return false;
        }

        // 4. Verificar si ya fue usado
        if (codigoData.usado) {
            console.log("[7] Código ya usado");
            return false;
        }

        // 5. Obtener ID único del dispositivo
        let dispositivoId = localStorage.getItem('deviceId');
        if (!dispositivoId) {
            dispositivoId = 'd-' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem('deviceId', dispositivoId);
        }
        console.log("[8] ID del dispositivo:", dispositivoId);

        // 6. Actualizar el código como usado
        console.log("[9] Marcando código como usado...");
        await db.collection("codigos").doc(doc.id).update({
            usado: true,
            dispositivo: dispositivoId,
            fechaUso: ahora.toISOString()
        });

        // 7. Guardar localmente para futuros accesos
        const codigosUsados = JSON.parse(localStorage.getItem('rifasSucre_codigos') || "[]");
        if (!codigosUsados.includes(codigo)) {
            codigosUsados.push(codigo);
            localStorage.setItem('rifasSucre_codigos', JSON.stringify(codigosUsados));
        }
        console.log("[10] Código guardado localmente");

        console.log("[11] ¡Verificación exitosa!");
        return true;

    } catch (error) {
        console.error("[ERROR] Detalles del error:", {
            message: error.message,
            code: error.code,
            stack: error.stack
        });

        // Manejo específico de errores conocidos
        if (error.code === 'unavailable' || error.code === 'network-error') {
            alert("🔴 Error de conexión. Verifica tu acceso a internet e intenta nuevamente.");
        } else {
            alert("🔴 Error al verificar el código: " + (error.message || "Por favor intenta más tarde"));
        }
        
        return false;
    }
}

function obtenerIdDispositivo() {
    let id = localStorage.getItem('deviceId');
    if (!id) {
        id = 'd-' + Math.random().toString(36).substr(2, 9);
        localStorage.setItem('deviceId', id);
    }
    return id;
}

function activarPrueba() {
    if (modoPrueba) {
        const diasRestantes = calcularDiasRestantesPrueba();
        if (diasRestantes > 0) {
            accesoContainer.classList.add('hidden');
            mainContainer.classList.remove('hidden');
            mostrarSeccion('rifas');
        }
        alert(`Ya estás en modo prueba. Días restantes: ${diasRestantes}`);
        return;
    }
    
    modoPrueba = true;
    fechaInicioPrueba = new Date();
    
    localStorage.setItem('rifasSucre_prueba', JSON.stringify({
        fechaInicio: fechaInicioPrueba
    }));
    
    accesoContainer.classList.add('hidden');
    mainContainer.classList.remove('hidden');
    mostrarSeccion('rifas');
    
    alert('Modo prueba activado por 7 días. ¡Disfruta de la aplicación!');
}

function verificarPrueba() {
    if (!modoPrueba) return;
    
    const diasRestantes = calcularDiasRestantesPrueba();
    
    if (diasRestantes <= 0) {
        modoPrueba = false;
        localStorage.removeItem('rifasSucre_prueba');
        accesoContainer.classList.remove('hidden');
        mainContainer.classList.add('hidden');
        alert('El período de prueba ha terminado. Por favor, adquiere un código de acceso.');
    } else if (diasRestantes <= 3) {
        alert(`¡Atención! Tu prueba gratuita termina en ${diasRestantes} días.`);
    }
}

function calcularDiasRestantesPrueba() {
    if (!fechaInicioPrueba) return 0;
    
    const hoy = new Date();
    const finPrueba = new Date(fechaInicioPrueba);
    finPrueba.setDate(finPrueba.getDate() + 7);
    
    const diffTime = finPrueba - hoy;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays;
}

function mostrarModalSuperusuario() {
    superusuarioModal.classList.remove('hidden');
    document.getElementById('superusuario-clave').value = '';
    document.getElementById('superusuario-clave').focus();
}

async function validarSuperusuario() {
    const clave = document.getElementById('superusuario-clave').value.trim();
    const superusuarioEmail = "leonardyjhn@gmail.com"; // Tu email registrado en Firebase
    
    // Validar campo vacío
    if (!clave) {
        alert('Por favor ingresa la clave de superusuario');
        return;
    }

    try {
        // 1. Autenticar en Firebase
        const userCredential = await auth.signInWithEmailAndPassword(
            superusuarioEmail,
            clave
        );
        
        // 2. Verificar autenticación exitosa
        if (userCredential.user) {
            superusuarioActivo = true;
            superusuarioModal.classList.add('hidden');
            
            // 3. Mostrar botón de seguridad
            document.getElementById('btn-seguridad').classList.remove('hidden');
            
            // 4. Configurar timeout de 1 hora
            if (superusuarioTimeout) clearTimeout(superusuarioTimeout);
            superusuarioTimeout = setTimeout(() => {
                superusuarioActivo = false;
                document.getElementById('btn-seguridad').classList.add('hidden');
                alert('Sesión de superusuario expirada por inactividad');
            }, 3600000); // 1 hora en milisegundos
            
            // 5. Redirigir a la vista principal
            accesoContainer.classList.add('hidden');
            mainContainer.classList.remove('hidden');
            mostrarSeccion('rifas');
            
            console.log('Superusuario autenticado:', userCredential.user.uid);
        }
        
    } catch (error) {
        // Manejo detallado de errores
        console.error('Error en autenticación:', error);
        
        let mensajeError = '';
        switch (error.code) {
            case 'auth/wrong-password':
                mensajeError = 'Clave incorrecta';
                break;
            case 'auth/user-not-found':
                mensajeError = 'Usuario no registrado';
                break;
            case 'auth/network-request-failed':
                mensajeError = 'Error de conexión a internet';
                break;
            default:
                mensajeError = 'Error al autenticar: ' + error.message;
        }
        
        alert(mensajeError);
        
        // Limpiar campo de contraseña
        document.getElementById('superusuario-clave').value = '';
    }
}

function mostrarSeccion(seccion) {
    // Ocultar todas las secciones
    rifasSection.classList.add('hidden');
    clientesSection.classList.add('hidden');
    respaldoSection.classList.add('hidden');
    seguridadSection.classList.add('hidden');
    
    // Limpiar contenido previo
    rifasSection.innerHTML = '';
    clientesSection.innerHTML = '';
    respaldoSection.innerHTML = '';
    seguridadSection.innerHTML = '';
    
    // Mostrar sección seleccionada
    switch (seccion) {
        case 'rifas':
            mostrarRifas();
            rifasSection.classList.remove('hidden');
            break;
        case 'clientes':
            mostrarClientes();
            clientesSection.classList.remove('hidden');
            break;
        case 'respaldo':
            mostrarRespaldo();
            respaldoSection.classList.remove('hidden');
            break;
        case 'seguridad':
            if (superusuarioActivo || modoPrueba) {
                mostrarSeguridad();
                seguridadSection.classList.remove('hidden');
            } else {
                alert('Acceso denegado. Solo para superusuario.');
                mostrarSeccion('rifas');
            }
            break;
    }
}

function mostrarRifas() {
    rifasSection.innerHTML = '';

    // Botón para crear nueva rifa
    const btnNuevaRifa = document.createElement('button');
    btnNuevaRifa.innerHTML = '<i class="fas fa-plus"></i> Nueva Rifa';
    btnNuevaRifa.addEventListener('click', mostrarModalNuevaRifa);
    rifasSection.appendChild(btnNuevaRifa);

    // Información de rifa activa
    const infoRifa = document.createElement('div');
    infoRifa.className = 'rifa-activa';
    if (rifaActiva) {
        const rifa = rifas.find(r => r.id === rifaActiva);
        if (rifa) {
            infoRifa.textContent = `Rifa activa: ${rifa.nombre} (${rifa.totalNumeros} números)`;
        } else {
            infoRifa.textContent = 'Ninguna rifa seleccionada';
            rifaActiva = null;
        }
    } else {
        infoRifa.textContent = 'Ninguna rifa seleccionada';
    }
    rifasSection.appendChild(infoRifa);

    // Lista de rifas
    if (rifas.length === 0) {
        const mensaje = document.createElement('p');
        mensaje.textContent = 'No hay rifas creadas. Crea tu primera rifa.';
        mensaje.style.marginTop = '20px';
        rifasSection.appendChild(mensaje);
        return;
    }

    const listaRifas = document.createElement('div');
    listaRifas.className = 'rifas-lista';
    
    rifas.forEach(rifa => {
        const rifaItem = document.createElement('div');
        rifaItem.className = `rifa-item ${rifaActiva === rifa.id ? 'activa' : ''}`;
        
        const rifaNombre = document.createElement('div');
        rifaNombre.className = 'rifa-nombre';
        rifaNombre.textContent = rifa.nombre;
        
        const rifaInfo = document.createElement('div');
        rifaInfo.className = 'rifa-info';
        rifaInfo.innerHTML = `
            <span>Números: ${rifa.totalNumeros}</span>
            <span>Columnas: ${rifa.columnas}</span>
            <span>Grillas: ${Math.ceil(rifa.totalNumeros / rifa.porGrilla)}</span>
        `;
        
        const rifaEstado = document.createElement('div');
        rifaEstado.className = 'rifa-info';
        
        // Calcular números disponibles, apartados y pagados
        const clientesRifa = clientes.filter(c => c.rifaId === rifa.id);
        let apartados = 0;
        let pagados = 0;
        
        clientesRifa.forEach(cliente => {
            const numerosCount = cliente.numeros.split(',').length;
            if (cliente.estado === 'apartado') {
                apartados += numerosCount;
            } else if (cliente.estado === 'pagado') {
                pagados += numerosCount;
            }
        });
        
        const disponibles = rifa.totalNumeros - apartados - pagados;
        
        rifaEstado.innerHTML = `
            <span>Disponibles: ${disponibles}</span>
            <span>Apartados: ${apartados}</span>
            <span>Pagados: ${pagados}</span>
        `;
        
        const rifaAcciones = document.createElement('div');
        rifaAcciones.className = 'rifa-acciones';
        
        const btnActivar = document.createElement('button');
        btnActivar.textContent = rifaActiva === rifa.id ? 'Activa' : 'Activar';
        btnActivar.addEventListener('click', () => {
            rifaActiva = rifa.id;
            localStorage.setItem('rifasSucre_rifaActiva', rifaActiva);
            mostrarRifas();
            mostrarClientes();
            actualizarInfoRifaActiva();
        });
        
        const btnCuadricula = document.createElement('button');
        btnCuadricula.textContent = 'Ver Cuadrícula';
        btnCuadricula.addEventListener('click', (e) => {
            e.stopPropagation();
            mostrarCuadriculaCompleta(rifa);
        });
        
        const btnEditar = document.createElement('button');
        btnEditar.textContent = 'Editar';
        btnEditar.addEventListener('click', () => mostrarModalEditarRifa(rifa));
        
        const btnEliminar = document.createElement('button');
        btnEliminar.textContent = 'Eliminar';
        btnEliminar.style.backgroundColor = '#e74c3c';
        btnEliminar.addEventListener('click', () => confirmarEliminarRifa(rifa.id));
        
        rifaAcciones.appendChild(btnActivar);
        rifaAcciones.appendChild(btnCuadricula);
        rifaAcciones.appendChild(btnEditar);
        rifaAcciones.appendChild(btnEliminar);
        
        rifaItem.appendChild(rifaNombre);
        rifaItem.appendChild(rifaInfo);
        rifaItem.appendChild(rifaEstado);
        rifaItem.appendChild(rifaAcciones);
        
        listaRifas.appendChild(rifaItem);
    });
    
    rifasSection.appendChild(listaRifas);
}

function mostrarModalNuevaRifa() {
    document.getElementById('rifa-modal-title').textContent = 'Nueva Rifa';
    document.getElementById('rifa-nombre').value = '';
    document.getElementById('rifa-total').value = '';
    document.getElementById('rifa-columnas').value = '';
    document.getElementById('rifa-por-grilla').value = '';
    
    document.getElementById('btn-guardar-rifa').onclick = guardarNuevaRifa;
    rifaModal.classList.remove('hidden');
}

function mostrarModalEditarRifa(rifa) {
    document.getElementById('rifa-modal-title').textContent = 'Editar Rifa';
    document.getElementById('rifa-nombre').value = rifa.nombre;
    document.getElementById('rifa-total').value = rifa.totalNumeros;
    document.getElementById('rifa-columnas').value = rifa.columnas;
    document.getElementById('rifa-por-grilla').value = rifa.porGrilla;
    
    document.getElementById('btn-guardar-rifa').onclick = () => guardarRifaEditada(rifa.id);
    rifaModal.classList.remove('hidden');
}

function guardarNuevaRifa() {
    const nombre = document.getElementById('rifa-nombre').value.trim();
    const total = parseInt(document.getElementById('rifa-total').value);
    const columnas = parseInt(document.getElementById('rifa-columnas').value);
    const porGrilla = parseInt(document.getElementById('rifa-por-grilla').value);
    
    if (!nombre || isNaN(total) || isNaN(columnas) || isNaN(porGrilla)) {
        alert('Por favor completa todos los campos correctamente');
        return;
    }
    
    if (total <= 0 || columnas <= 0 || porGrilla <= 0) {
        alert('Los valores deben ser mayores a cero');
        return;
    }
    
    const nuevaRifa = {
        id: Date.now().toString(),
        nombre,
        totalNumeros: total,
        columnas,
        porGrilla,
        fechaCreacion: new Date().toISOString()
    };
    
    rifas.push(nuevaRifa);
    guardarDatos();
    rifaModal.classList.add('hidden');
    mostrarRifas();
}

function guardarRifaEditada(id) {
    const nombre = document.getElementById('rifa-nombre').value.trim();
    const total = parseInt(document.getElementById('rifa-total').value);
    const columnas = parseInt(document.getElementById('rifa-columnas').value);
    const porGrilla = parseInt(document.getElementById('rifa-por-grilla').value);
    
    if (!nombre || isNaN(total) || isNaN(columnas) || isNaN(porGrilla)) {
        alert('Por favor completa todos los campos correctamente');
        return;
    }
    
    if (total <= 0 || columnas <= 0 || porGrilla <= 0) {
        alert('Los valores deben ser mayores a cero');
        return;
    }
    
    const rifaIndex = rifas.findIndex(r => r.id === id);
    if (rifaIndex === -1) {
        alert('No se encontró la rifa a editar');
        return;
    }
    
    rifas[rifaIndex] = {
        ...rifas[rifaIndex],
        nombre,
        totalNumeros: total,
        columnas,
        porGrilla
    };
    
    guardarDatos();
    rifaModal.classList.add('hidden');
    mostrarRifas();
}

function confirmarEliminarRifa(id) {
    const clientesAsociados = clientes.filter(c => c.rifaId === id);
    
    if (clientesAsociados.length > 0) {
        mostrarConfirmacion(
            'Eliminar Rifa',
            'Esta rifa tiene clientes asociados. ¿Estás seguro de que deseas eliminarla? Esto también eliminará todos los clientes asociados.',
            () => eliminarRifa(id)
        );
    } else {
        mostrarConfirmacion(
            'Eliminar Rifa',
            '¿Estás seguro de que deseas eliminar esta rifa?',
            () => eliminarRifa(id)
        );
    }
}

function eliminarRifa(id) {
    rifas = rifas.filter(r => r.id !== id);
    clientes = clientes.filter(c => c.rifaId !== id);
    
    if (rifaActiva === id) {
        rifaActiva = null;
        localStorage.removeItem('rifasSucre_rifaActiva');
    }
    
    guardarDatos();
    mostrarRifas();
    mostrarClientes();
    actualizarInfoRifaActiva();
    rifasSection.innerHTML = '';
    mostrarRifas();
}

function mostrarCuadriculaCompleta(rifa) {
    if (!rifa) {
        console.error("Error: No se proporcionó la rifa.");
        return;
    }

    cuadriculaModal.classList.remove('hidden');
    document.getElementById('modal-rifa-title').textContent = rifa.nombre;

    const cuadriculaContainer = document.getElementById('cuadricula-completa');
    cuadriculaContainer.innerHTML = '';

    const numerosPorGrilla = rifa.porGrilla;
    const totalGrillas = Math.ceil(rifa.totalNumeros / numerosPorGrilla);

    const grillasContainer = document.createElement('div');
    grillasContainer.className = 'grillas-container';
    cuadriculaContainer.appendChild(grillasContainer);

    for (let g = 0; g < totalGrillas; g++) {
        const inicio = g * numerosPorGrilla;
        const fin = Math.min(inicio + numerosPorGrilla, rifa.totalNumeros);

        const grilla = document.createElement('div');
        grilla.className = 'grilla';
        grilla.id = `grilla-${g}`;

        const contenedorBotones = document.createElement('div');
        contenedorBotones.className = 'grilla-botones';

        const btnDescargarGrilla = document.createElement('button');
        btnDescargarGrilla.className = 'btn-descargar-grilla';
        btnDescargarGrilla.innerHTML = '<i class="fas fa-download"></i> Descargar esta grilla';
        btnDescargarGrilla.addEventListener('click', (e) => {
            e.stopPropagation();
            descargarGrillaIndividual(grilla, rifa.nombre, g + 1);
        });
        contenedorBotones.appendChild(btnDescargarGrilla);
        grilla.appendChild(contenedorBotones);

        const tituloGrilla = document.createElement('h3');
        tituloGrilla.textContent = `Grilla ${g + 1}: Números ${inicio.toString().padStart(3, '0')}-${(fin - 1).toString().padStart(3, '0')}`;
        grilla.appendChild(tituloGrilla);

        const numerosContainer = document.createElement('div');
        numerosContainer.className = 'numeros-container';
        numerosContainer.style.gridTemplateColumns = `repeat(${rifa.columnas}, 1fr)`;
        grilla.appendChild(numerosContainer);

        for (let i = inicio; i < fin; i++) {
            const num = i.toString().padStart(3, '0');
            const numeroElement = document.createElement('div');
            numeroElement.className = 'numero-rifa';
            numeroElement.textContent = num;

            const estadoNumero = obtenerEstadoNumero(rifa.id, num);
            if (estadoNumero.cliente) {
                numeroElement.classList.add(estadoNumero.estado);
                numeroElement.title = `${estadoNumero.cliente} - ${estadoNumero.estado}`;
            } else {
                numeroElement.classList.add('disponible');
                numeroElement.title = 'Disponible';
            }

            numerosContainer.appendChild(numeroElement);
        }

        grillasContainer.appendChild(grilla);
    }

    document.querySelectorAll('.filtro-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.filtro-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const filtro = this.dataset.filtro;
            const numeros = cuadriculaContainer.querySelectorAll('.numero-rifa');
            
            numeros.forEach(num => {
                num.style.display = 'flex';
                
                if (filtro === 'disponibles' && !num.classList.contains('disponible')) {
                    num.style.display = 'none';
                } else if (filtro === 'apartados' && !num.classList.contains('apartado')) {
                    num.style.display = 'none';
                } else if (filtro === 'pagados' && !num.classList.contains('pagado')) {
                    num.style.display = 'none';
                }
            });
        });
    });

    document.getElementById('descargar-cuadricula').onclick = () => descargarCuadricula(rifa);
    
    // Configurar control de tamaño de cuadros
    const tamanioCuadros = document.getElementById('tamanio-cuadros');
    const tamanioValor = document.getElementById('tamanio-valor');
    
    tamanioCuadros.addEventListener('input', function() {
        const valor = this.value;
        tamanioValor.textContent = `${valor}px`;
        
        const numeros = document.querySelectorAll('.numero-rifa');
        numeros.forEach(num => {
            num.style.width = `${valor}px`;
            num.style.height = `${valor}px`;
            num.style.fontSize = `${Math.max(10, valor / 2)}px`;
        });
    });
}

function descargarGrillaIndividual(grillaElement, nombreRifa, numeroGrilla) {
    const loadingDiv = document.createElement('div');
    loadingDiv.id = 'loading-descarga';
    loadingDiv.innerHTML = `
        <div style="
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0,0,0,0.7);
            z-index: 9999;
            display: flex;
            justify-content: center;
            align-items: center;
            flex-direction: column;
            color: white;
        ">
            <div style="font-size: 20px; margin-bottom: 20px;">
                <i class="fas fa-spinner fa-spin"></i> Generando imagen...
            </div>
            <div style="font-size: 14px;">Por favor espere, esto puede tomar unos segundos</div>
        </div>
    `;
    document.body.appendChild(loadingDiv);

    const elementoOriginal = grillaElement;
    const clone = elementoOriginal.cloneNode(true);
    clone.style.position = 'absolute';
    clone.style.left = '-9999px';
    clone.style.top = '0';
    clone.style.background = 'white';
    clone.style.padding = '20px';
    clone.style.borderRadius = '5px';
    
    const botones = clone.querySelector('.grilla-botones');
    if (botones) botones.style.display = 'none';

    document.body.appendChild(clone);

    const opciones = {
        scale: 1,
        logging: true,
        useCORS: true,
        allowTaint: false,
        backgroundColor: '#ffffff',
        scrollX: 0,
        scrollY: 0,
        windowWidth: clone.scrollWidth,
        windowHeight: clone.scrollHeight
    };

    setTimeout(() => {
        html2canvas(clone, opciones).then(canvas => {
            const link = document.createElement('a');
            link.download = `Rifa_${nombreRifa}_Grilla_${numeroGrilla}.png`;
            link.href = canvas.toDataURL('image/png', 1.0);
            link.style.display = 'none';
            
            document.body.appendChild(link);
            link.click();
            
            document.body.removeChild(link);
            document.body.removeChild(clone);
            document.body.removeChild(loadingDiv);
        }).catch(err => {
            console.error('Error al generar imagen:', err);
            alert('Error al generar la imagen. Por favor intente nuevamente.');
            document.body.removeChild(clone);
            document.body.removeChild(loadingDiv);
        });
    }, 500);
}

function obtenerEstadoNumero(rifaId, numero) {
    const cliente = clientes.find(c => 
        c.rifaId === rifaId && 
        c.numeros.split(',').some(n => n.startsWith(numero))
    );
    
    if (!cliente) return { estado: 'disponible', cliente: null };
    
    const numData = cliente.numeros.split(',')
        .find(n => n.startsWith(numero));
    
    return {
        estado: numData.includes(':') ? numData.split(':')[1] : cliente.estado,
        cliente: cliente.nombre
    };
}

function descargarCuadricula(rifa) {
    const loadingMessage = document.createElement('div');
    loadingMessage.textContent = 'Generando imagen, por favor espere...';
    loadingMessage.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 20px;
        border-radius: 5px;
        z-index: 9999;
    `;
    document.body.appendChild(loadingMessage);

    const elemento = document.getElementById('cuadricula-completa');
    
    const opciones = {
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        scrollX: 0,
        scrollY: -window.scrollY
    };

    html2canvas(elemento, opciones).then(canvas => {
        const enlace = document.createElement('a');
        enlace.download = `Rifa_${rifa.nombre}_${new Date().toISOString().slice(0,10)}.png`;
        enlace.href = canvas.toDataURL('image/png');
        
        document.body.appendChild(enlace);
        enlace.click();
        document.body.removeChild(enlace);
        
        document.body.removeChild(loadingMessage);
    }).catch(error => {
        console.error('Error al generar la imagen:', error);
        alert('Ocurrió un error al generar la imagen');
        document.body.removeChild(loadingMessage);
    });
}

function mostrarClientes() {
    if (!rifaActiva) {
        clientesSection.innerHTML = `
            <div class="alert">
                <p>No hay ninguna rifa seleccionada. Por favor, selecciona una rifa primero.</p>
                <button id="btn-seleccionar-rifa">Seleccionar Rifa</button>
            </div>
        `;
        
        document.getElementById('btn-seleccionar-rifa').addEventListener('click', () => {
            mostrarSeccion('rifas');
        });
        
        return;
    }
    
    const rifa = rifas.find(r => r.id === rifaActiva);
    
    const header = document.createElement('div');
    header.innerHTML = `
        <h2>Clientes - ${rifa.nombre}</h2>
        <div class="button-group">
            <button id="btn-nuevo-cliente"><i class="fas fa-plus"></i> Nuevo Cliente</button>
            <button id="btn-plantilla-mensaje"><i class="fas fa-envelope"></i> Mensaje Plantilla</button>
            <button id="btn-plantilla-ticket"><i class="fas fa-ticket-alt"></i> Plantilla Ticket</button>
        </div>
    `;
    clientesSection.appendChild(header);
    
    // Nuevo: Filtros para clientes
    const filtrosContainer = document.createElement('div');
    filtrosContainer.className = 'filtros-clientes';
    filtrosContainer.innerHTML = `
        <button class="filtro-cliente-btn ${filtroClientes === 'todos' ? 'active' : ''}" data-filtro="todos">
            <i class="fas fa-users"></i> Todos los clientes
        </button>
        <button class="filtro-cliente-btn ${filtroClientes === 'con-apartados' ? 'active' : ''}" data-filtro="con-apartados">
            <i class="fas fa-hourglass-half"></i> Con números apartados
        </button>
        <button class="filtro-cliente-btn ${filtroClientes === 'con-pagados' ? 'active' : ''}" data-filtro="con-pagados">
            <i class="fas fa-check-circle"></i> Con números pagados
        </button>
    `;
    clientesSection.appendChild(filtrosContainer);
    
    // Configurar eventos de los filtros
    document.querySelectorAll('.filtro-cliente-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            filtroClientes = this.dataset.filtro;
            document.querySelectorAll('.filtro-cliente-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            actualizarListaClientes();
        });
    });
    
    const buscador = document.createElement('div');
    buscador.className = 'buscador';
    buscador.innerHTML = `
        <input type="text" id="buscador-clientes" placeholder="Buscar por nombre, teléfono o números...">
    `;
    clientesSection.appendChild(buscador);
    
    const listaClientes = document.createElement('div');
    listaClientes.className = 'clientes-lista';
    clientesSection.appendChild(listaClientes);
    
    document.getElementById('btn-nuevo-cliente').addEventListener('click', mostrarModalNuevoCliente);
    document.getElementById('btn-plantilla-mensaje').addEventListener('click', mostrarModalPlantilla);
    document.getElementById('btn-plantilla-ticket').addEventListener('click', mostrarModalPlantillaTicket);
    document.getElementById('buscador-clientes').addEventListener('input', filtrarClientes);
    
    actualizarListaClientes();
}

function actualizarListaClientes() {
    if (!rifaActiva) return;
    
    const listaClientes = document.querySelector('.clientes-lista');
    listaClientes.innerHTML = '';
    
    let clientesRifa = clientes
        .filter(c => c.rifaId === rifaActiva)
        .sort((a, b) => parseInt(a.numeroCliente.slice(1)) - parseInt(b.numeroCliente.slice(1)));
    
    // Aplicar filtro según selección
    if (filtroClientes !== 'todos') {
        clientesRifa = clientesRifa.filter(cliente => {
            const numeros = cliente.numeros.split(',');
            
            if (filtroClientes === 'con-apartados') {
                return numeros.some(num => {
                    const estado = num.includes(':') ? num.split(':')[1] : cliente.estado;
                    return estado === 'apartado';
                });
            } else if (filtroClientes === 'con-pagados') {
                return numeros.some(num => {
                    const estado = num.includes(':') ? num.split(':')[1] : cliente.estado;
                    return estado === 'pagado';
                });
            }
            return true;
        });
    }
    
    if (clientesRifa.length === 0) {
        listaClientes.innerHTML = '<p>No hay clientes registrados para esta rifa.</p>';
        return;
    }
    
    clientesRifa.forEach(cliente => {
        const clienteItem = document.createElement('div');
        clienteItem.className = 'cliente-item';
        
        const clienteHeader = document.createElement('div');
        clienteHeader.className = 'cliente-header';
        clienteHeader.innerHTML = `
            <span class="cliente-numero">${cliente.numeroCliente}</span>
            <span class="cliente-telefono">${cliente.telefono}</span>
        `;
        
        const clienteNombre = document.createElement('div');
        clienteNombre.className = 'cliente-nombre';
        clienteNombre.textContent = cliente.nombre;
        
        const clienteNumeros = document.createElement('div');
        clienteNumeros.className = 'cliente-numeros';

        // Ordenar los números numéricamente antes de mostrarlos
        cliente.numeros.split(',')
            .sort((a, b) => {
                const numA = parseInt(a.includes(':') ? a.split(':')[0] : a);
                const numB = parseInt(b.includes(':') ? b.split(':')[0] : b);
                return numA - numB;
            })
            .forEach(numCompleto => {
                const [num, estadoIndividual] = numCompleto.includes(':') ? 
                    numCompleto.split(':') : 
                    [numCompleto, cliente.estado];
                
                const numElement = document.createElement('div');
                numElement.className = `cliente-numero-rifa ${estadoIndividual}`;
                numElement.textContent = num;
                
                numElement.style.cssText = `
                    cursor: pointer;
                    display: inline-block;
                    margin: 2px;
                    padding: 2px 5px;
                    border-radius: 3px;
                    border: 1px solid #ddd;
                `;
                
                numElement.addEventListener('click', (e) => {
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    mostrarMenuNumeros(e, num, cliente);
                });
                
                clienteNumeros.appendChild(numElement);
            });
        
        const clienteAcciones = document.createElement('div');
        clienteAcciones.className = 'cliente-acciones';
        
        const btnWhatsApp = document.createElement('button');
        btnWhatsApp.innerHTML = '<i class="fab fa-whatsapp"></i> WhatsApp';
        btnWhatsApp.addEventListener('click', (e) => {
            e.stopPropagation();
            enviarWhatsApp(cliente);
        });

        // Nuevo botón Rezagados (solo si tiene números apartados)
        const tieneApartados = cliente.numeros.split(',').some(num => {
            const estado = num.includes(':') ? num.split(':')[1] : cliente.estado;
            return estado === 'apartado';
        });

        if (tieneApartados) {
            const btnRezagados = document.createElement('button');
            btnRezagados.innerHTML = '<i class="fas fa-exclamation-circle"></i> Rezagados';
            btnRezagados.style.backgroundColor = '#e67e22'; // Color naranja
            btnRezagados.addEventListener('click', (e) => {
                e.stopPropagation();
                enviarRezagados(cliente);
            });
            clienteAcciones.appendChild(btnRezagados);
        }
        
        const btnTicket = document.createElement('button');
        btnTicket.innerHTML = '<i class="fas fa-ticket-alt"></i> Ticket';
        btnTicket.addEventListener('click', (e) => {
            e.stopPropagation();
            generarTicket(cliente);
        });
        
        const btnEditar = document.createElement('button');
        btnEditar.innerHTML = '<i class="fas fa-edit"></i> Editar';
        btnEditar.addEventListener('click', (e) => {
            e.stopPropagation();
            mostrarModalEditarCliente(cliente);
        });
        
        const btnEliminar = document.createElement('button');
        btnEliminar.innerHTML = '<i class="fas fa-trash"></i> Eliminar';
        btnEliminar.style.backgroundColor = '#e74c3c';
        btnEliminar.addEventListener('click', (e) => {
            e.stopPropagation();
            confirmarEliminarCliente(cliente.id);
        });
        
        clienteAcciones.appendChild(btnWhatsApp);
        clienteAcciones.appendChild(btnTicket);
        clienteAcciones.appendChild(btnEditar);
        clienteAcciones.appendChild(btnEliminar);
        
        clienteItem.appendChild(clienteHeader);
        clienteItem.appendChild(clienteNombre);
        clienteItem.appendChild(clienteNumeros);
        clienteItem.appendChild(clienteAcciones);
        
        listaClientes.appendChild(clienteItem);
    });
}


function filtrarClientes() {
    const busqueda = document.getElementById('buscador-clientes').value.toLowerCase();
    const clientesItems = document.querySelectorAll('.cliente-item');
    
    if (!busqueda) {
        clientesItems.forEach(item => item.style.display = 'block');
        return;
    }
    
    clientesItems.forEach(item => {
        const nombre = item.querySelector('.cliente-nombre').textContent.toLowerCase();
        const telefono = item.querySelector('.cliente-telefono').textContent.toLowerCase();
        const numeros = item.querySelector('.cliente-numeros').textContent.toLowerCase();
        
        if (nombre.includes(busqueda) || telefono.includes(busqueda) || numeros.includes(busqueda)) {
            item.style.display = 'block';
        } else {
            item.style.display = 'none';
        }
    });
}

function mostrarModalNuevoCliente() {
    document.getElementById('cliente-modal-title').textContent = 'Nuevo Cliente';
    document.getElementById('cliente-nombre').value = '';
    document.getElementById('cliente-telefono').value = '';
    document.getElementById('cliente-numeros').value = '';
    document.getElementById('cliente-estado').value = 'apartado';
    
    document.getElementById('btn-guardar-cliente').onclick = guardarNuevoCliente;
    clienteModal.classList.remove('hidden');
}

function mostrarModalEditarCliente(cliente) {
    document.getElementById('cliente-modal-title').textContent = 'Editar Cliente';
    document.getElementById('cliente-nombre').value = cliente.nombre;
    document.getElementById('cliente-telefono').value = cliente.telefono;
    document.getElementById('cliente-numeros').value = cliente.numeros;
    document.getElementById('cliente-estado').value = cliente.estado;
    
    document.getElementById('btn-guardar-cliente').onclick = () => guardarClienteEditado(cliente.id);
    clienteModal.classList.remove('hidden');
}

function guardarNuevoCliente() {
    if (!rifaActiva) {
        alert('No hay rifa seleccionada');
        return;
    }
    
    const nombre = document.getElementById('cliente-nombre').value.trim();
    const telefono = document.getElementById('cliente-telefono').value.trim();
    const numeros = document.getElementById('cliente-numeros').value.trim();
    const estado = document.getElementById('cliente-estado').value;
    
    if (!nombre || !telefono || !numeros) {
        alert('Por favor completa todos los campos');
        return;
    }
    
    // Eliminar duplicados y espacios
    const numerosArray = [...new Set(numeros.split(',').map(n => n.trim()))];
    
    if (numerosArray.length !== numeros.split(',').length) {
        alert('Has ingresado números duplicados. Se han eliminado los repetidos.');
    }
    
    const rifa = rifas.find(r => r.id === rifaActiva);
    
    for (const num of numerosArray) {
        if (isNaN(num) || num === '') {
            alert(`El número "${num}" no es válido`);
            return;
        }
        
        const numFormateado = parseInt(num).toString().padStart(3, '0');
        if (parseInt(numFormateado) >= rifa.totalNumeros) {
            alert(`El número ${numFormateado} excede el total de números de la rifa (${rifa.totalNumeros})`);
            return;
        }
    }
    
    const numerosOcupados = {};
    const clientesRifa = clientes.filter(c => c.rifaId === rifaActiva);
    
    clientesRifa.forEach(cliente => {
        cliente.numeros.split(',').forEach(num => {
            const numFormateado = parseInt(num).toString().padStart(3, '0');
            numerosOcupados[numFormateado] = true;
        });
    });
    
    const numerosNoDisponibles = numerosArray.filter(num => {
        const numFormateado = parseInt(num).toString().padStart(3, '0');
        return numerosOcupados[numFormateado];
    });
    
    if (numerosNoDisponibles.length > 0) {
        alert(`Los siguientes números ya están ocupados: ${numerosNoDisponibles.join(', ')}`);
        return;
    }
    
    let numeroCliente = '';
    const numerosClientes = clientes.map(c => parseInt(c.numeroCliente.slice(1)));
    const maxNumero = numerosClientes.length > 0 ? Math.max(...numerosClientes) : 0;
    
    let huecoEncontrado = false;
    for (let i = 1; i <= maxNumero; i++) {
        if (!numerosClientes.includes(i)) {
            numeroCliente = `#${i.toString().padStart(3, '0')}`;
            huecoEncontrado = true;
            break;
        }
    }
    
    if (!huecoEncontrado) {
        numeroCliente = `#${(maxNumero + 1).toString().padStart(3, '0')}`;
    }
    
    const nuevoCliente = {
        id: Date.now().toString(),
        rifaId: rifaActiva,
        numeroCliente,
        nombre,
        telefono,
        numeros: numerosArray.map(n => parseInt(n).toString().padStart(3, '0')).join(','),
        estado,
        fechaRegistro: new Date().toISOString()
    };
    
    clientes.push(nuevoCliente);
    guardarDatos();
    clienteModal.classList.add('hidden');
    actualizarListaClientes();
}

function guardarClienteEditado(id) {
    const nombre = document.getElementById('cliente-nombre').value.trim();
    const telefono = document.getElementById('cliente-telefono').value.trim();
    const numerosInput = document.getElementById('cliente-numeros').value.trim();
    const estado = document.getElementById('cliente-estado').value;
    
    if (!nombre || !telefono || !numerosInput) {
        alert('Por favor completa todos los campos');
        return;
    }
    
    const clienteIndex = clientes.findIndex(c => c.id === id);
    if (clienteIndex === -1) return;
    
    // Limpiar los números quitando cualquier estado que puedan tener y eliminar duplicados
    const numerosArray = [...new Set(numerosInput.split(',').map(n => {
        const num = n.trim();
        return num.includes(':') ? num.split(':')[0] : num;
    }))];
    
    if (numerosArray.length !== numerosInput.split(',').length) {
        alert('Has ingresado números duplicados. Se han eliminado los repetidos.');
    }
    
    const rifa = rifas.find(r => r.id === clientes[clienteIndex].rifaId);
    
    for (const num of numerosArray) {
        if (isNaN(num) || num === '') {
            alert(`El número "${num}" no es válido`);
            return;
        }
        
        const numFormateado = parseInt(num).toString().padStart(3, '0');
        if (parseInt(numFormateado) >= rifa.totalNumeros) {
            alert(`El número ${numFormateado} excede el total de números de la rifa (${rifa.totalNumeros})`);
            return;
        }
    }
    
    const numerosOcupados = {};
    const clientesRifa = clientes.filter(c => c.rifaId === clientes[clienteIndex].rifaId && c.id !== id);
    
    clientesRifa.forEach(cliente => {
        cliente.numeros.split(',').forEach(num => {
            const numFormateado = parseInt(num.includes(':') ? num.split(':')[0] : num).toString().padStart(3, '0');
            numerosOcupados[numFormateado] = true;
        });
    });
    
    const numerosNoDisponibles = numerosArray.filter(num => {
        const numFormateado = parseInt(num).toString().padStart(3, '0');
        return numerosOcupados[numFormateado];
    });
    
    if (numerosNoDisponibles.length > 0) {
        alert(`Los siguientes números ya están ocupados: ${numerosNoDisponibles.join(', ')}`);
        return;
    }
    
    // Mantener los estados individuales de los números que ya los tenían
    const clienteActual = clientes[clienteIndex];
    const numerosConEstado = numerosArray.map(num => {
        const numFormateado = parseInt(num).toString().padStart(3, '0');
        // Buscar si el número ya tenía un estado definido
        const numExistente = clienteActual.numeros.split(',').find(n => {
            const numPart = n.includes(':') ? n.split(':')[0] : n;
            return numPart === numFormateado;
        });
        
        // Si existía y tenía estado, mantenerlo, de lo contrario usar el estado general
        if (numExistente && numExistente.includes(':')) {
            return numExistente;
        } else {
            return numFormateado;
        }
    });
    
    clientes[clienteIndex] = {
        ...clienteActual,
        nombre,
        telefono,
        numeros: numerosConEstado.join(','),
        estado
    };
    
    guardarDatos();
    clienteModal.classList.add('hidden');
    actualizarListaClientes();
}

function mostrarMenuNumeros(event, numero, cliente) {
    const menusPrevios = document.querySelectorAll('.menu-numero');
    menusPrevios.forEach(menu => menu.remove());
    
    const menu = document.createElement('div');
    menu.className = 'menu-numero';
    
    const clickX = event.clientX;
    const clickY = event.clientY;
    
    menu.style.cssText = `
        position: fixed;
        left: ${clickX}px;
        top: ${clickY}px;
        z-index: 1000;
        background: white;
        border: 1px solid #ddd;
        border-radius: 5px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        min-width: 180px;
    `;
    
    const estadoActual = obtenerEstadoNumero(cliente.rifaId, numero).estado;

    if (estadoActual !== 'pagado') {
        const opPagado = document.createElement('div');
        opPagado.textContent = 'Marcar como Pagado';
        opPagado.style.padding = '8px 15px';
        opPagado.style.cursor = 'pointer';
        opPagado.onclick = () => {
            cambiarEstadoNumero(numero, cliente, 'pagado');
            menu.remove();
        };
        menu.appendChild(opPagado);
    }

    if (estadoActual !== 'apartado') {
        const opApartado = document.createElement('div');
        opApartado.textContent = 'Marcar como Apartado';
        opApartado.style.padding = '8px 15px';
        opApartado.style.cursor = 'pointer';
        opApartado.onclick = () => {
            cambiarEstadoNumero(numero, cliente, 'apartado');
            menu.remove();
        };
        menu.appendChild(opApartado);
    }

    const opEliminar = document.createElement('div');
    opEliminar.textContent = 'Eliminar número';
    opEliminar.style.cssText = `
        padding: 8px 15px;
        cursor: pointer;
        color: #e74c3c;
    `;
    opEliminar.onclick = () => {
        eliminarNumero(numero, cliente);
        menu.remove();
    };
    menu.appendChild(opEliminar);

    document.body.appendChild(menu);

    setTimeout(() => {
        const clickHandler = (e) => {
            if (!menu.contains(e.target) && !e.target.classList.contains('cliente-numero-rifa')) {
                menu.remove();
                document.removeEventListener('click', clickHandler);
            }
        };
        document.addEventListener('click', clickHandler);
    }, 10);
}

function cambiarEstadoNumero(numero, cliente, nuevoEstado) {
    const nuevosNumeros = cliente.numeros.split(',').map(num => {
        const numActual = num.includes(':') ? num.split(':')[0] : num;
        return numActual === numero ? `${numero}:${nuevoEstado}` : num;
    });

    cliente.numeros = nuevosNumeros.join(',');
    guardarDatos();
    actualizarListaClientes();
}

function eliminarNumero(numero, cliente) {
    mostrarConfirmacion(
        'Eliminar número',
        `¿Eliminar el número ${numero} de ${cliente.nombre}?`,
        () => {
            const nuevosNumeros = cliente.numeros.split(',')
                .filter(num => !num.startsWith(numero));
            
            if (nuevosNumeros.length === 0) {
                clientes = clientes.filter(c => c.id !== cliente.id);
            } else {
                cliente.numeros = nuevosNumeros.join(',');
            }
            
            guardarDatos();
            actualizarListaClientes();
        }
    );
}

function confirmarEliminarCliente(id) {
    mostrarConfirmacion(
        'Eliminar Cliente',
        '¿Estás seguro de que deseas eliminar este cliente?',
        () => eliminarCliente(id)
    );
}

function eliminarCliente(id) {
    clientes = clientes.filter(c => c.id !== id);
    guardarDatos();
    actualizarListaClientes();
    mostrarRifas();
}

function enviarWhatsApp(cliente) {
    const rifa = rifas.find(r => r.id === cliente.rifaId);
    const plantilla = localStorage.getItem('rifasSucre_plantilla') || '';
    
    // Limpiar los números para mostrar (quitar los estados)
    const numerosLimpios = cliente.numeros.split(',').map(num => {
        return num.includes(':') ? num.split(':')[0] : num;
    }).join(', ');
    
    let mensaje = plantilla
        .replace(/{nombre}/g, cliente.nombre)
        .replace(/{rifa}/g, rifa.nombre)
        .replace(/{numeros}/g, numerosLimpios)
        .replace(/{estado}/g, cliente.estado);
    
    const url = `https://wa.me/${cliente.telefono}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
}

function generarTicket(cliente) {
    const rifa = rifas.find(r => r.id === cliente.rifaId);
    if (!rifa) {
        alert('No se encontró la rifa asociada al cliente');
        return;
    }

    const ticketElement = document.createElement('div');
    ticketElement.style.cssText = `
        width: 300px;
        padding: 20px;
        background: white;
        border-radius: 10px;
        box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        font-family: Arial, sans-serif;
        color: #333;
    `;

    const numerosHTML = cliente.numeros.split(',').map(numCompleto => {
        const [num, estadoIndividual] = numCompleto.includes(':') ? 
            numCompleto.split(':') : 
            [numCompleto, cliente.estado];
            
        return `<span style="display: inline-block; margin: 2px; padding: 2px 5px; 
                border-radius: 3px; border: 1px solid #ddd; 
                background: ${estadoIndividual === 'pagado' ? '#2ecc71' : '#f1c40f'}; 
                color: ${estadoIndividual === 'pagado' ? 'white' : '#333'}">
                ${num}
                </span>`;
    }).join('');

    const tituloTicket = localStorage.getItem('plantillaTicketTitulo') || 'TICKET DE RIFA';
    let mensajeTicket = localStorage.getItem('plantillaTicketMensaje') || 
        'Cliente: {nombre}\nTeléfono: {telefono}\nNúmeros: {numeros}\nEstado: {estado}\nFecha: {fecha}';

    // Limpiar los números para mostrar en el mensaje (quitar los estados)
    const numerosLimpios = cliente.numeros.split(',').map(num => {
        return num.includes(':') ? num.split(':')[0] : num;
    }).join(', ');

    mensajeTicket = mensajeTicket
        .replace(/{nombre}/g, cliente.nombre)
        .replace(/{telefono}/g, cliente.telefono)
        .replace(/{rifa}/g, rifa.nombre)
        .replace(/{numeros}/g, numerosLimpios)
        .replace(/{estado}/g, cliente.estado)
        .replace(/{fecha}/g, new Date().toLocaleDateString());

    const mensajeHTML = mensajeTicket.split('\n').map(line => 
        `<div style="margin-bottom: 8px;">${line}</div>`
    ).join('');

    ticketElement.innerHTML = `
        <h2 style="text-align: center; margin-bottom: 15px; color: #2c3e50;">${tituloTicket}</h2>
        ${mensajeHTML}
        <div style="margin-bottom: 15px;"><strong>Números:</strong><br>${numerosHTML}</div>
        <div style="text-align: center; font-size: 12px; color: #7f8c8d;">
            ${new Date().toLocaleDateString()} - ${appTitle.textContent}
        </div>
    `;

    document.body.appendChild(ticketElement);

    const loadingMessage = document.createElement('div');
    loadingMessage.textContent = 'Generando ticket...';
    loadingMessage.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: rgba(0,0,0,0.8);
        color: white;
        padding: 20px;
        border-radius: 5px;
        z-index: 9999;
    `;
    document.body.appendChild(loadingMessage);

    html2canvas(ticketElement).then(canvas => {
        const image = canvas.toDataURL('image/png');
        const url = `https://wa.me/${cliente.telefono}?text=${encodeURIComponent('Aquí está tu ticket de rifa')}`;
        
        const link = document.createElement('a');
        link.href = image;
        link.download = `ticket_${cliente.nombre}.png`;
        
        const whatsappWindow = window.open(url, '_blank');
        
        setTimeout(() => {
            document.body.removeChild(ticketElement);
            document.body.removeChild(loadingMessage);
            
            if (whatsappWindow) {
                setTimeout(() => {
                    link.click();
                }, 1000);
            } else {
                link.click();
            }
        }, 1000);
    }).catch(err => {
        console.error('Error al generar ticket:', err);
        alert('Error al generar el ticket');
        document.body.removeChild(ticketElement);
        document.body.removeChild(loadingMessage);
    });
}

function enviarRezagados(cliente) {
    const rifa = rifas.find(r => r.id === cliente.rifaId);
    const plantilla = localStorage.getItem('rifasSucre_plantilla_rezagados') || 
                     localStorage.getItem('rifasSucre_plantilla') || 
                     '¡Hola {nombre}! Recordatorio: Tus números {numeros} en la rifa "{rifa}" están como {estado}. Por favor completa tu pago. ¡Gracias!';
    
    // Limpiar los números para mostrar (quitar los estados)
    const numerosLimpios = cliente.numeros.split(',').map(num => {
        return num.includes(':') ? num.split(':')[0] : num;
    }).join(', ');
    
    let mensaje = plantilla
        .replace(/{nombre}/g, cliente.nombre)
        .replace(/{rifa}/g, rifa.nombre)
        .replace(/{numeros}/g, numerosLimpios)
        .replace(/{estado}/g, cliente.estado);
    
    const url = `https://wa.me/${cliente.telefono}?text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
}

function mostrarModalPlantilla() {
    // Cargar plantillas
    const plantillaWhatsApp = localStorage.getItem('rifasSucre_plantilla') || '';
    const plantillaRezagados = localStorage.getItem('rifasSucre_plantilla_rezagados') || plantillaWhatsApp;
    
    document.getElementById('plantilla-mensaje').value = plantillaWhatsApp;
    document.getElementById('plantilla-rezagados').value = plantillaRezagados;
    
    // Configurar eventos de pestañas
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            this.classList.add('active');
            document.getElementById(`${this.dataset.tab}-tab`).classList.add('active');
        });
    });
    
    document.getElementById('btn-guardar-plantilla').onclick = guardarPlantillas;
    plantillaModal.classList.remove('hidden');
}

function guardarPlantillas() {
    const plantillaWhatsApp = document.getElementById('plantilla-mensaje').value;
    const plantillaRezagados = document.getElementById('plantilla-rezagados').value;
    
    localStorage.setItem('rifasSucre_plantilla', plantillaWhatsApp);
    localStorage.setItem('rifasSucre_plantilla_rezagados', plantillaRezagados);
    plantillaModal.classList.add('hidden');
    alert('Plantillas guardadas correctamente');
}

function guardarPlantilla() {
    const plantilla = document.getElementById('plantilla-mensaje').value;
    localStorage.setItem('rifasSucre_plantilla', plantilla);
    plantillaModal.classList.add('hidden');
    alert('Plantilla guardada correctamente');
}

function mostrarModalPlantillaTicket() {
    document.getElementById('plantilla-ticket-titulo').value = 
        localStorage.getItem('plantillaTicketTitulo') || 'TICKET DE RIFA';
    document.getElementById('plantilla-ticket-mensaje').value = 
        localStorage.getItem('plantillaTicketMensaje') || 'Cliente: {nombre}\nTeléfono: {telefono}\nNúmeros: {numeros}\nEstado: {estado}\nFecha: {fecha}';
    
    plantillaTicketModal.classList.remove('hidden');
}

function guardarPlantillaTicket() {
    const titulo = document.getElementById('plantilla-ticket-titulo').value.trim();
    const mensaje = document.getElementById('plantilla-ticket-mensaje').value.trim();
    
    if (!titulo || !mensaje) {
        alert('Por favor completa todos los campos');
        return;
    }
    
    localStorage.setItem('plantillaTicketTitulo', titulo);
    localStorage.setItem('plantillaTicketMensaje', mensaje);
    plantillaTicketModal.classList.add('hidden');
    alert('Plantilla de ticket guardada correctamente');
}

function mostrarRespaldo() {
    respaldoSection.innerHTML = `
        <h2>Respaldo de Datos</h2>
        <p>Aquí puedes crear una copia de seguridad de todos tus datos o restaurar desde una copia previa.</p>
        
        <div class="respaldo-acciones">
            <button id="btn-crear-respaldo"><i class="fas fa-save"></i> Crear Respaldo</button>
            <button id="btn-restaurar-respaldo"><i class="fas fa-upload"></i> Restaurar Respaldo</button>
        </div>
    `;
    
    document.getElementById('btn-crear-respaldo').addEventListener('click', crearRespaldo);
    document.getElementById('btn-restaurar-respaldo').addEventListener('click', restaurarRespaldo);
}

function crearRespaldo() {
    const datos = {
        rifas,
        clientes,
        codigosUsados,
        rifaActiva,
        fechaRespaldo: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(datos, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `respaldo_rifas_sucre_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    
    alert('Respaldo creado correctamente');
}

function restaurarRespaldo() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    
    input.onchange = e => {
        const file = e.target.files[0];
        if (!file) return;
        
        const reader = new FileReader();
        reader.onload = event => {
            try {
                const datos = JSON.parse(event.target.result);
                
                mostrarConfirmacion(
                    'Restaurar Respaldo',
                    '¿Estás seguro de que deseas restaurar este respaldo? Todos los datos actuales serán reemplazados.',
                    () => {
                        rifas = datos.rifas || [];
                        clientes = datos.clientes || [];
                        codigosUsados = datos.codigosUsados || [];
                        rifaActiva = datos.rifaActiva || null;
                        
                        guardarDatos();
                        alert('Respaldo restaurado correctamente');
                        mostrarSeccion('rifas');
                    }
                );
            } catch (error) {
                alert('Error al leer el archivo de respaldo. Asegúrate de que es un archivo válido.');
            }
        };
        reader.readAsText(file);
    };
    
    input.click();
}

function mostrarSeguridad() {
    if (!superusuarioActivo && !modoPrueba) {
        seguridadSection.innerHTML = '<p>Acceso denegado. Solo para superusuario.</p>';
        return;
    }
    
    seguridadSection.innerHTML = `
        <h2>Seguridad</h2>
        <p>Desde aquí puedes generar códigos de acceso de un solo uso.</p>
        
        <div class="seguridad-info">
            <div class="info-box">
                <h3><i class="fas fa-info-circle"></i> Información</h3>
                <p>Modo Prueba: ${modoPrueba ? 'ACTIVO' : 'INACTIVO'}</p>
                ${modoPrueba ? `<p>Días restantes: ${calcularDiasRestantesPrueba()}</p>` : ''}
                <p>Superusuario: ${superusuarioActivo ? 'ACTIVO' : 'INACTIVO'}</p>
            </div>
        </div>
        
        ${superusuarioActivo ? `
        <button id="btn-generar-codigo-modal"><i class="fas fa-key"></i> Generar Código</button>
        <button id="btn-cerrar-sesion"><i class="fas fa-sign-out-alt"></i> Cerrar Sesión Superusuario</button>
        
        <h3>Códigos Generados</h3>
        <div id="lista-codigos">
            ${codigosFirebase.length > 0 ? 
                codigosFirebase.map(codigo => `
                    <div class="codigo-item">
                        <p><strong>Código:</strong> ${codigo.codigo}</p>
                        <p><strong>Expira:</strong> ${new Date(codigo.expiracion).toLocaleDateString()}</p>
                        <p><strong>Generado:</strong> ${new Date(codigo.generadoEl).toLocaleDateString()}</p>
                        <p><strong>Estado:</strong> ${codigo.usado ? 'USADO' : 'DISPONIBLE'}</p>
                        ${codigo.usado ? `<p><strong>Dispositivo:</strong> ${codigo.dispositivo || 'No registrado'}</p>` : ''}
                        <hr>
                    </div>
                `).join('') : 
                '<p>No hay códigos generados recientemente.</p>'
            }
        </div>
        ` : ''}
    `;
    
    if (superusuarioActivo) {
        document.getElementById('btn-generar-codigo-modal').addEventListener('click', () => {
            seguridadModal.classList.remove('hidden');
            document.getElementById('codigo-generado-container').classList.add('hidden');
        });
        
        document.getElementById('btn-cerrar-sesion').addEventListener('click', cerrarSesionSuperusuario);
    }
}

async function generarCodigoAcceso() {
    const duracion = parseInt(document.getElementById('codigo-duracion').value);
    
    if (isNaN(duracion) || duracion <= 0) {
        alert('Por favor ingresa una duración válida (mayor a 0 días)');
        return;
    }
    
    // 1. Generar código numérico de 8 dígitos
    const codigo = Math.floor(10000000 + Math.random() * 90000000).toString();
    
    // 2. Calcular fecha de expiración
    const expiracion = new Date();
    expiracion.setDate(expiracion.getDate() + duracion);
    
    // 3. Guardar en Firebase
    try {
        await db.collection("codigos").add({
            codigo,
            expiracion: expiracion.toISOString(),
            generadoEl: new Date().toISOString(),
            usado: false,
            generadoPor: superusuarioActivo ? "superusuario" : "sistema"
        });
    } catch (error) {
        console.error("Error al guardar en Firebase:", error);
        alert("Error al conectar con el servidor. Intenta nuevamente.");
        return;
    }
    
    // 4. Guardar localmente
    const codigosValidos = JSON.parse(localStorage.getItem('rifasSucre_codigosValidos') || "[]");
    codigosValidos.push({
        codigo: codigo,
        expiracion: expiracion.toISOString(),
        generadoEl: new Date().toISOString()
    });
    localStorage.setItem('rifasSucre_codigosValidos', JSON.stringify(codigosValidos));
    
    // 5. Mostrar al usuario
    document.getElementById('codigo-generado').textContent = codigo;
    document.getElementById('codigo-generado-container').classList.remove('hidden');
    
    // 6. Actualizar la lista visible
    mostrarSeguridad();
    
    alert(`Código generado: ${codigo}\nEste código expira en ${duracion} días.`);
}
async function generarCodigoFirebase(duracionDias) {
    try {
        if (!superusuarioActivo) {
            alert('Solo el superusuario puede generar códigos');
            return null;
        }

        const codigo = Math.floor(10000000 + Math.random() * 90000000).toString();
        const expiracion = new Date();
        expiracion.setDate(expiracion.getDate() + duracionDias);

        await db.collection("codigos").add({
            codigo,
            expiracion: expiracion.toISOString(),
            generadoEl: new Date().toISOString(),
            usado: false,
            generadoPor: auth.currentUser.uid
        });

        return codigo;
    } catch (error) {
        console.error("Error generando código:", error);
        return null;
    }
}

function cerrarSesionSuperusuario() {
    superusuarioActivo = false;
    if (superusuarioTimeout) clearTimeout(superusuarioTimeout);
    document.getElementById('btn-seguridad').classList.add('hidden');
    alert('Sesión de superusuario cerrada');
    mostrarSeccion('rifas');
}

function mostrarConfirmacion(titulo, mensaje, callback) {
    document.getElementById('confirmacion-titulo').textContent = titulo;
    document.getElementById('confirmacion-mensaje').textContent = mensaje;
    
    const btnSi = document.getElementById('confirmacion-si');
    const btnNo = document.getElementById('confirmacion-no');
    
    btnSi.onclick = null;
    btnNo.onclick = null;
    
    btnSi.onclick = () => {
        confirmacionModal.classList.add('hidden');
        if (callback) callback();
    };
    
    btnNo.onclick = () => {
        confirmacionModal.classList.add('hidden');
    };
    
    confirmacionModal.classList.remove('hidden');
}

function actualizarInfoRifaActiva() {
    if (rifaActiva) {
        const rifa = rifas.find(r => r.id === rifaActiva);
        rifaActivaInfo.textContent = `Rifa activa: ${rifa.nombre} (${rifa.totalNumeros} números)`;
    } else {
        rifaActivaInfo.textContent = 'Ninguna rifa seleccionada';
    }
}

function guardarDatos() {
    localStorage.setItem('rifasSucre_rifas', JSON.stringify(rifas));
    localStorage.setItem('rifasSucre_clientes', JSON.stringify(clientes));
    localStorage.setItem('rifasSucre_codigos', JSON.stringify(codigosUsados));
    
    if (rifaActiva) {
        localStorage.setItem('rifasSucre_rifaActiva', rifaActiva);
    }
}

function salir() {
    if (superusuarioActivo) {
        cerrarSesionSuperusuario();
    }
    
    mainContainer.classList.add('hidden');
    accesoContainer.classList.remove('hidden');
    codigoAccesoInput.value = '';
    codigoAccesoInput.focus();
}
