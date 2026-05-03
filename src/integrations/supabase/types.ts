export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      auditoria_items: {
        Row: {
          auditoria_id: string
          creado_en: string
          equipo_id: string
          estado: Database["public"]["Enums"]["estado_item_auditoria"]
          id: string
          notas: string | null
          ubicacion_encontrada: string | null
          usuario_encontrado: string | null
          verificado_en: string | null
        }
        Insert: {
          auditoria_id: string
          creado_en?: string
          equipo_id: string
          estado?: Database["public"]["Enums"]["estado_item_auditoria"]
          id?: string
          notas?: string | null
          ubicacion_encontrada?: string | null
          usuario_encontrado?: string | null
          verificado_en?: string | null
        }
        Update: {
          auditoria_id?: string
          creado_en?: string
          equipo_id?: string
          estado?: Database["public"]["Enums"]["estado_item_auditoria"]
          id?: string
          notas?: string | null
          ubicacion_encontrada?: string | null
          usuario_encontrado?: string | null
          verificado_en?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auditoria_items_auditoria_id_fkey"
            columns: ["auditoria_id"]
            isOneToOne: false
            referencedRelation: "auditorias"
            referencedColumns: ["id"]
          },
        ]
      }
      auditorias: {
        Row: {
          actualizado_en: string
          creado_en: string
          estado: Database["public"]["Enums"]["estado_auditoria"]
          fecha_fin: string | null
          fecha_inicio: string
          filial_id: string | null
          id: string
          nombre: string
          observaciones: string | null
          responsable: string | null
          sector_id: string | null
        }
        Insert: {
          actualizado_en?: string
          creado_en?: string
          estado?: Database["public"]["Enums"]["estado_auditoria"]
          fecha_fin?: string | null
          fecha_inicio?: string
          filial_id?: string | null
          id?: string
          nombre: string
          observaciones?: string | null
          responsable?: string | null
          sector_id?: string | null
        }
        Update: {
          actualizado_en?: string
          creado_en?: string
          estado?: Database["public"]["Enums"]["estado_auditoria"]
          fecha_fin?: string | null
          fecha_inicio?: string
          filial_id?: string | null
          id?: string
          nombre?: string
          observaciones?: string | null
          responsable?: string | null
          sector_id?: string | null
        }
        Relationships: []
      }
      equipos: {
        Row: {
          actualizado_en: string
          almacenamiento_gb: number | null
          codigo_inventario: string
          creado_en: string
          estado: Database["public"]["Enums"]["estado_equipo"]
          fecha_adquisicion: string | null
          filial_id: string | null
          foto_url: string | null
          garantia_hasta: string | null
          id: string
          ip_asignada: string | null
          mac_address: string | null
          marca: string | null
          modelo: string | null
          numero_factura: string | null
          numero_imei: string | null
          numero_serie: string | null
          observaciones: string | null
          procesador: string | null
          proveedor: string | null
          ram_gb: number | null
          sector_id: string | null
          sistema_operativo: string | null
          tipo_equipo: Database["public"]["Enums"]["tipo_equipo"]
          usuario_asignado: string | null
          valor_compra: number | null
        }
        Insert: {
          actualizado_en?: string
          almacenamiento_gb?: number | null
          codigo_inventario: string
          creado_en?: string
          estado?: Database["public"]["Enums"]["estado_equipo"]
          fecha_adquisicion?: string | null
          filial_id?: string | null
          foto_url?: string | null
          garantia_hasta?: string | null
          id?: string
          ip_asignada?: string | null
          mac_address?: string | null
          marca?: string | null
          modelo?: string | null
          numero_factura?: string | null
          numero_imei?: string | null
          numero_serie?: string | null
          observaciones?: string | null
          procesador?: string | null
          proveedor?: string | null
          ram_gb?: number | null
          sector_id?: string | null
          sistema_operativo?: string | null
          tipo_equipo: Database["public"]["Enums"]["tipo_equipo"]
          usuario_asignado?: string | null
          valor_compra?: number | null
        }
        Update: {
          actualizado_en?: string
          almacenamiento_gb?: number | null
          codigo_inventario?: string
          creado_en?: string
          estado?: Database["public"]["Enums"]["estado_equipo"]
          fecha_adquisicion?: string | null
          filial_id?: string | null
          foto_url?: string | null
          garantia_hasta?: string | null
          id?: string
          ip_asignada?: string | null
          mac_address?: string | null
          marca?: string | null
          modelo?: string | null
          numero_factura?: string | null
          numero_imei?: string | null
          numero_serie?: string | null
          observaciones?: string | null
          procesador?: string | null
          proveedor?: string | null
          ram_gb?: number | null
          sector_id?: string | null
          sistema_operativo?: string | null
          tipo_equipo?: Database["public"]["Enums"]["tipo_equipo"]
          usuario_asignado?: string | null
          valor_compra?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "equipos_filial_id_fkey"
            columns: ["filial_id"]
            isOneToOne: false
            referencedRelation: "filiales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "equipos_sector_id_fkey"
            columns: ["sector_id"]
            isOneToOne: false
            referencedRelation: "sectores"
            referencedColumns: ["id"]
          },
        ]
      }
      filiales: {
        Row: {
          actualizado_en: string
          ciudad: string | null
          codigo_filial: string
          creado_en: string
          id: string
          nombre: string
          pais: string | null
        }
        Insert: {
          actualizado_en?: string
          ciudad?: string | null
          codigo_filial: string
          creado_en?: string
          id?: string
          nombre: string
          pais?: string | null
        }
        Update: {
          actualizado_en?: string
          ciudad?: string | null
          codigo_filial?: string
          creado_en?: string
          id?: string
          nombre?: string
          pais?: string | null
        }
        Relationships: []
      }
      mantenimientos: {
        Row: {
          costo: number | null
          creado_en: string
          descripcion: string | null
          equipo_id: string
          estado: Database["public"]["Enums"]["estado_mantenimiento"]
          fecha: string
          id: string
          tecnico: string | null
          tipo: Database["public"]["Enums"]["tipo_mantenimiento"]
        }
        Insert: {
          costo?: number | null
          creado_en?: string
          descripcion?: string | null
          equipo_id: string
          estado?: Database["public"]["Enums"]["estado_mantenimiento"]
          fecha?: string
          id?: string
          tecnico?: string | null
          tipo: Database["public"]["Enums"]["tipo_mantenimiento"]
        }
        Update: {
          costo?: number | null
          creado_en?: string
          descripcion?: string | null
          equipo_id?: string
          estado?: Database["public"]["Enums"]["estado_mantenimiento"]
          fecha?: string
          id?: string
          tecnico?: string | null
          tipo?: Database["public"]["Enums"]["tipo_mantenimiento"]
        }
        Relationships: [
          {
            foreignKeyName: "mantenimientos_equipo_id_fkey"
            columns: ["equipo_id"]
            isOneToOne: false
            referencedRelation: "equipos"
            referencedColumns: ["id"]
          },
        ]
      }
      movimientos: {
        Row: {
          creado_en: string
          equipo_id: string
          fecha: string
          filial_destino: string | null
          filial_origen: string | null
          id: string
          observaciones: string | null
          responsable: string | null
          sector_destino: string | null
          sector_origen: string | null
          tipo_movimiento: Database["public"]["Enums"]["tipo_movimiento"]
          usuario_destino: string | null
          usuario_origen: string | null
        }
        Insert: {
          creado_en?: string
          equipo_id: string
          fecha?: string
          filial_destino?: string | null
          filial_origen?: string | null
          id?: string
          observaciones?: string | null
          responsable?: string | null
          sector_destino?: string | null
          sector_origen?: string | null
          tipo_movimiento: Database["public"]["Enums"]["tipo_movimiento"]
          usuario_destino?: string | null
          usuario_origen?: string | null
        }
        Update: {
          creado_en?: string
          equipo_id?: string
          fecha?: string
          filial_destino?: string | null
          filial_origen?: string | null
          id?: string
          observaciones?: string | null
          responsable?: string | null
          sector_destino?: string | null
          sector_origen?: string | null
          tipo_movimiento?: Database["public"]["Enums"]["tipo_movimiento"]
          usuario_destino?: string | null
          usuario_origen?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "movimientos_equipo_id_fkey"
            columns: ["equipo_id"]
            isOneToOne: false
            referencedRelation: "equipos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_filial_destino_fkey"
            columns: ["filial_destino"]
            isOneToOne: false
            referencedRelation: "filiales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_filial_origen_fkey"
            columns: ["filial_origen"]
            isOneToOne: false
            referencedRelation: "filiales"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_sector_destino_fkey"
            columns: ["sector_destino"]
            isOneToOne: false
            referencedRelation: "sectores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "movimientos_sector_origen_fkey"
            columns: ["sector_origen"]
            isOneToOne: false
            referencedRelation: "sectores"
            referencedColumns: ["id"]
          },
        ]
      }
      sectores: {
        Row: {
          actualizado_en: string
          creado_en: string
          filial_id: string
          id: string
          nombre: string
        }
        Insert: {
          actualizado_en?: string
          creado_en?: string
          filial_id: string
          id?: string
          nombre: string
        }
        Update: {
          actualizado_en?: string
          creado_en?: string
          filial_id?: string
          id?: string
          nombre?: string
        }
        Relationships: [
          {
            foreignKeyName: "sectores_filial_id_fkey"
            columns: ["filial_id"]
            isOneToOne: false
            referencedRelation: "filiales"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      estado_auditoria: "En curso" | "Finalizada" | "Cancelada"
      estado_equipo:
        | "Activo"
        | "En reparacion"
        | "De baja"
        | "En deposito"
        | "Extraviado"
      estado_item_auditoria:
        | "Pendiente"
        | "Verificado"
        | "No encontrado"
        | "Discrepancia"
      estado_mantenimiento: "Pendiente" | "En proceso" | "Completado"
      tipo_equipo:
        | "PC"
        | "Notebook"
        | "Celular"
        | "Impresora"
        | "Escaner"
        | "Servidor"
        | "Tablet"
        | "UPS"
        | "Otro"
      tipo_mantenimiento: "Preventivo" | "Correctivo"
      tipo_movimiento:
        | "Asignacion"
        | "Reasignacion"
        | "Reparacion"
        | "Baja"
        | "Ingreso"
        | "Traslado entre filiales"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      estado_auditoria: ["En curso", "Finalizada", "Cancelada"],
      estado_equipo: [
        "Activo",
        "En reparacion",
        "De baja",
        "En deposito",
        "Extraviado",
      ],
      estado_item_auditoria: [
        "Pendiente",
        "Verificado",
        "No encontrado",
        "Discrepancia",
      ],
      estado_mantenimiento: ["Pendiente", "En proceso", "Completado"],
      tipo_equipo: [
        "PC",
        "Notebook",
        "Celular",
        "Impresora",
        "Escaner",
        "Servidor",
        "Tablet",
        "UPS",
        "Otro",
      ],
      tipo_mantenimiento: ["Preventivo", "Correctivo"],
      tipo_movimiento: [
        "Asignacion",
        "Reasignacion",
        "Reparacion",
        "Baja",
        "Ingreso",
        "Traslado entre filiales",
      ],
    },
  },
} as const
