export type UserRole = "administrador" | "vendedor";

export interface UserPermissions {
  productos?: {
    crear?: boolean;
    editar?: boolean;
    eliminar?: boolean;
    ocultar?: boolean;
    cambiarPrecios?: boolean;
    cambiarStock?: boolean;
    subirImagenes?: boolean;
  };
  categorias?: {
    crear?: boolean;
    editar?: boolean;
    eliminar?: boolean;
    cambiarOrden?: boolean;
  };
  marcas?: {
    crear?: boolean;
    editar?: boolean;
    eliminar?: boolean;
  };
  cotizaciones?: {
    crear?: boolean;
    verPropias?: boolean;
    verTodas?: boolean;
    eliminar?: boolean;
    cambiarEstado?: boolean;
  };
  usuarios?: {
    invitar?: boolean;
    editarPermisos?: boolean;
    desactivar?: boolean;
    eliminar?: boolean;
  };
  configuracion?: {
    editar?: boolean;
  };
}

export interface AppUser {
  id: string;
  nombre: string;
  apellido?: string;
  correo: string;
  foto?: string;
  cargo?: string;
  rol?: UserRole;
  isSuperAdmin?: boolean;
  activo: boolean;
  fechaCreacion: string;
  ultimoAcceso?: string;
  permisos: UserPermissions;
  requiresPasswordChange?: boolean;
}

export interface Category {
  id: string;
  nombre: string;
  imagen?: string;
  icono?: string;
  color?: string;
  orden: number;
  activo: boolean;
  fechaCreacion?: string;
}

export interface Subcategory {
  id: string;
  nombre: string;
  categoriaId: string;
  orden: number;
  activo: boolean;
}

export interface Brand {
  id: string;
  nombre: string;
  logo?: string;
  color?: string;
  orden: number;
  activo: boolean;
}

export interface Gender {
  id: string;
  nombre: string;
  orden: number;
  activo: boolean;
}

export interface Size {
  id: string;
  nombre: string;
  orden: number;
  activo: boolean;
}

export type OlfactoryCategory =
  | "acordes"
  | "notasSalida"
  | "notasCorazon"
  | "notasFondo";

export interface OlfactoryNote {
  id: string;
  nombre: string;
  imagen?: string;
  categoria: OlfactoryCategory;
  activo: boolean;
  fechaCreacion: string;
}

export interface ProductAccord {
  id: string;
  intensidad: number;
}

export type ProductStatus = "publicado" | "borrador" | "oculto" | "agotado";

export interface ProductVariant {
  id: string;
  nombre: string;
  imagen?: string;
  precio?: number;
  precioOferta?: number;
  stock?: number;
  codigo?: string;
}

export interface Product {
  id: string;
  nombre: string;
  descripcion?: string;
  codigoInterno?: string;
  sku?: string;
  marcaId: string;
  categoriaId: string;
  subcategoriaId?: string;
  genero?: string;
  precio: number;
  precioOferta?: number;
  stock: number;
  imagenes: string[];
  imagenInformativa?: string;
  video?: string;
  estado: ProductStatus;
  etiquetas: string[];
  variantes?: ProductVariant[];
  tallas?: string[];
  acordes?: ProductAccord[];
  notasSalida?: string[];
  notasCorazon?: string[];
  notasFondo?: string[];
  destacado?: boolean;
  nuevo?: boolean;
  oferta?: boolean;
  visible: boolean;
  notasInternas?: string;
  fechaCreacion: string;
  fechaActualizacion: string;
  creadoPor?: string;
  actualizadoPor?: string;
}

export interface ProductWithRelations extends Product {
  marca?: Brand;
  categoria?: Category;
  subcategoria?: Subcategory;
}

export interface QuoteProduct {
  productoId: string;
  nombre: string;
  imagen: string;
  cantidad: number;
  precio: number;
  subtotal: number;
  talla?: string;
}

export type QuoteStatus =
  | "creada"
  | "enviada"
  | "vista"
  | "aceptada"
  | "rechazada"
  | "completada"
  | "pendiente";

export interface QuoteClient {
  nombre?: string;
  telefono?: string;
  correo?: string;
  empresa?: string;
  notas?: string;
}

export interface Quote {
  id: string;
  codigo: string;
  cliente: QuoteClient;
  productos: QuoteProduct[];
  subtotal: number;
  descuento?: number;
  total: number;
  creadoPor: string;
  vendedorNombre?: string;
  estado: QuoteStatus;
  fechaCreacion: string;
  fechaVencimiento?: string;
  observaciones?: string;
}

export interface CompanySettings {
  nombre: string;
  descripcion?: string;
  logo?: string;
  telefono?: string;
  correo?: string;
  direccion?: string;
  sitioWeb?: string;
  redesSociales?: {
    instagram?: string;
    facebook?: string;
    whatsapp?: string;
  };
}

export interface CatalogSettings {
  mostrarPrecio: boolean;
  mostrarStock: boolean;
  mostrarMarca: boolean;
  mostrarCategoria: boolean;
  productosPorPagina: number;
  ordenDefault: string;
}

export interface QuoteSettings {
  prefijo: string;
  longitudNumeros: number;
  mensajeAutomatico: string;
  observacionesAutomaticas?: string;
  validezDias?: number;
}

export interface AppearanceSettings {
  colorPrincipal: string;
  colorSecundario: string;
  modoOscuro: boolean;
}

export interface HomeSettings {
  videoInicio?: string;
  videos?: string[];
  imagenRespaldo?: string;
  tituloPrincipal: string;
  subtitulo?: string;
  textoBoton: string;
}

export interface AppSettings {
  id?: string;
  empresa: CompanySettings;
  catalogo: CatalogSettings;
  cotizaciones: QuoteSettings;
  apariencia: AppearanceSettings;
  inicio: HomeSettings;
  licenseStatus: "active" | "suspended";
  licenseReason?: string;
  nextPaymentDate?: string;
  version?: string;
}

export interface Invitation {
  id: string;
  correo: string;
  nombre: string;
  cargo?: string;
  permisos: UserPermissions;
  creadoPor: string;
  estado: "pendiente" | "aceptada" | "expirada";
  fechaCreacion: string;
  token: string;
}

export interface CartItem {
  id?: string;
  productoId: string;
  nombre: string;
  imagen: string;
  precio: number;
  cantidad: number;
  talla?: string;
}

export interface ActivityLog {
  id?: string;
  usuario: string;
  accion: string;
  elemento: string;
  fecha: string;
}

export type SyncQueueItemType =
  | "crearCotizacion"
  | "actualizarProducto"
  | "crearProducto";

export interface SyncQueueItem {
  id: string;
  tipo: SyncQueueItemType;
  datos: unknown;
  fecha: string;
  estado: "pendiente" | "procesando" | "completado" | "error";
  intentos: number;
}
