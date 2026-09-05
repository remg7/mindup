/**
 * ============================================================================
 * MindUP - Control de Acceso Basado en Roles (RBAC)
 * ============================================================================
 * Buenas Prácticas & Clean Code:
 * - Tipado y enumeraciones inmutables (Object.freeze)
 * - Funciones puras y desacopladas
 * - Matriz de permisos declarativa y extensible
 * ============================================================================
 */

// 1. DEFINICIÓN DE LOS 3 ROLES DEL SISTEMA
export const ROLES = Object.freeze({
  ADMIN: 'admin',
  USUARIO: 'usuario',
  AUDITOR: 'auditor'
});

// 2. DEFINICIÓN DE PERMISOS GRANULARES
export const PERMISOS = Object.freeze({
  // Permisos de Diario y Estados de Ánimo
  DIARIO_CREAR: 'diario:crear',
  DIARIO_LEER_PROPIO: 'diario:leer_propio',
  DIARIO_LEER_TODOS: 'diario:leer_todos',
  DIARIO_EDITAR_PROPIO: 'diario:editar_propio',
  DIARIO_BORRAR_PROPIO: 'diario:borrar_propio',
  DIARIO_BORRAR_CUALQUIERA: 'diario:borrar_cualquiera',

  // Permisos de Administración
  USUARIOS_GESTIONAR: 'usuarios:gestionar',
  SISTEMA_CONFIGURAR: 'sistema:configurar',

  // Permisos de Auditoría y Trazabilidad
  AUDITORIA_VER_LOGS: 'auditoria:ver_logs',
  AUDITORIA_EXPORTAR_REPORTES: 'auditoria:exportar_reportes'
});

// 3. MATRIZ DE PERMISOS POR ROL (RBAC Matrix)
export const MATRIZ_PERMISOS = Object.freeze({
  [ROLES.ADMIN]: [
    PERMISOS.DIARIO_CREAR,
    PERMISOS.DIARIO_LEER_PROPIO,
    PERMISOS.DIARIO_LEER_TODOS,
    PERMISOS.DIARIO_EDITAR_PROPIO,
    PERMISOS.DIARIO_BORRAR_PROPIO,
    PERMISOS.DIARIO_BORRAR_CUALQUIERA,
    PERMISOS.USUARIOS_GESTIONAR,
    PERMISOS.SISTEMA_CONFIGURAR,
    PERMISOS.AUDITORIA_VER_LOGS,
    PERMISOS.AUDITORIA_EXPORTAR_REPORTES
  ],
  [ROLES.USUARIO]: [
    PERMISOS.DIARIO_CREAR,
    PERMISOS.DIARIO_LEER_PROPIO,
    PERMISOS.DIARIO_EDITAR_PROPIO,
    PERMISOS.DIARIO_BORRAR_PROPIO
  ],
  [ROLES.AUDITOR]: [
    PERMISOS.DIARIO_LEER_TODOS,
    PERMISOS.AUDITORIA_VER_LOGS,
    PERMISOS.AUDITORIA_EXPORTAR_REPORTES
    // NOTA: El auditor NO tiene permisos de creación, edición o borrado.
  ]
});

/**
 * Valida si un rol específico tiene un permiso determinado
 * @param {string} rol - Rol del usuario ('admin', 'usuario', 'auditor')
 * @param {string} permiso - Permiso a consultar
 * @returns {boolean}
 */
export function tienePermiso(rol, permiso) {
  if (!rol || !MATRIZ_PERMISOS[rol]) return false;
  return MATRIZ_PERMISOS[rol].includes(permiso);
}

/**
 * Obtiene la lista de capacidades y etiquetas descriptivas para la UI
 * @param {string} rol
 * @returns {object}
 */
export function obtenerMetadatosRol(rol) {
  const metadatos = {
    [ROLES.ADMIN]: {
      etiqueta: 'Administrador del Sistema',
      badgeColor: '#00f2fe',
      descripcion: 'Acceso total y control de usuarios',
      puedeEscribir: true
    },
    [ROLES.USUARIO]: {
      etiqueta: 'Usuario Registrado',
      badgeColor: '#10b981',
      descripcion: 'Gestión de bienestar y datos personales',
      puedeEscribir: true
    },
    [ROLES.AUDITOR]: {
      etiqueta: 'Auditor de Seguridad y Cumplimiento',
      badgeColor: '#c084fc',
      descripcion: 'Solo lectura, trazabilidad e inspección de logs',
      puedeEscribir: false
    }
  };

  return metadatos[rol] || {
    etiqueta: 'Invitado',
    badgeColor: '#8b949e',
    descripcion: 'Sin permisos asignados',
    puedeEscribir: false
  };
}
