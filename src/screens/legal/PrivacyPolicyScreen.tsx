import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

export default function PrivacyPolicyScreen() {
  const navigation = useNavigation();

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.content}>

        <Text style={styles.updated}>Última actualización: febrero 2025</Text>

        <Text style={styles.intro}>
          En ParkShare nos tomamos muy en serio la privacidad de tus datos. Esta política
          explica qué información recogemos, cómo la usamos y cuáles son tus derechos
          conforme al Reglamento General de Protección de Datos (RGPD / GDPR).
        </Text>

        {/* 1 */}
        <Text style={styles.sectionTitle}>1. Responsable del tratamiento</Text>
        <Text style={styles.body}>
          <Text style={styles.bold}>Razón social:</Text> ParkShare SL (en constitución){'\n'}
          <Text style={styles.bold}>CIF:</Text> Pendiente de asignación{'\n'}
          <Text style={styles.bold}>Domicilio:</Text> España{'\n'}
          <Text style={styles.bold}>Email de contacto:</Text> privacidad@parkshare.es
        </Text>

        {/* 2 */}
        <Text style={styles.sectionTitle}>2. Datos que recogemos</Text>
        <Text style={styles.body}>Recogemos los siguientes datos personales:</Text>
        <Text style={styles.bullet}>• <Text style={styles.bold}>Datos de cuenta:</Text> nombre completo, dirección de email y contraseña cifrada.</Text>
        <Text style={styles.bullet}>• <Text style={styles.bold}>Datos de ubicación:</Text> tu posición GPS para mostrar plazas cercanas. Solo se procesa mientras usas la app.</Text>
        <Text style={styles.bullet}>• <Text style={styles.bold}>Datos de pago:</Text> información de tarjeta gestionada exclusivamente por Stripe. ParkShare no almacena datos de tarjeta.</Text>
        <Text style={styles.bullet}>• <Text style={styles.bold}>Foto de perfil:</Text> imagen opcional que subes voluntariamente.</Text>
        <Text style={styles.bullet}>• <Text style={styles.bold}>Fotos de plazas:</Text> imágenes que subes al publicar una plaza de parking.</Text>
        <Text style={styles.bullet}>• <Text style={styles.bold}>Datos de uso:</Text> reservas realizadas, valoraciones y actividad dentro de la app.</Text>
        <Text style={styles.bullet}>• <Text style={styles.bold}>Token de notificaciones:</Text> identificador de dispositivo para enviarte notificaciones push.</Text>

        {/* 3 */}
        <Text style={styles.sectionTitle}>3. Finalidad y base jurídica del tratamiento</Text>
        <Text style={styles.body}>
          Tratamos tus datos para:{'\n\n'}
          • <Text style={styles.bold}>Prestación del servicio</Text> (base: ejecución de contrato): gestionar tu cuenta, procesar reservas y pagos.{'\n\n'}
          • <Text style={styles.bold}>Notificaciones</Text> (base: consentimiento): avisarte del estado de tus reservas y pagos.{'\n\n'}
          • <Text style={styles.bold}>Seguridad</Text> (base: interés legítimo): prevenir fraudes y abusos de la plataforma.{'\n\n'}
          • <Text style={styles.bold}>Obligaciones legales</Text> (base: cumplimiento normativo): conservar facturas y registros fiscales.
        </Text>

        {/* 4 */}
        <Text style={styles.sectionTitle}>4. Terceros que reciben tus datos</Text>
        <Text style={styles.bullet}>• <Text style={styles.bold}>Stripe Inc.</Text> — procesador de pagos. Política: stripe.com/es/privacy</Text>
        <Text style={styles.bullet}>• <Text style={styles.bold}>Google Firebase</Text> — base de datos, autenticación y almacenamiento. Política: firebase.google.com/support/privacy</Text>
        <Text style={styles.bullet}>• <Text style={styles.bold}>Expo (Expo Inc.)</Text> — envío de notificaciones push. Política: expo.dev/privacy</Text>
        <Text style={styles.bullet}>• <Text style={styles.bold}>Google Maps</Text> — visualización de mapas y ubicaciones. Política: policies.google.com/privacy</Text>
        <Text style={styles.body}>
          Ninguno de estos proveedores vende tus datos a terceros. Todos operan bajo acuerdos de
          tratamiento de datos conformes al RGPD.
        </Text>

        {/* 5 */}
        <Text style={styles.sectionTitle}>5. Transferencias internacionales</Text>
        <Text style={styles.body}>
          Algunos proveedores (Stripe, Google, Expo) pueden procesar datos fuera del Espacio
          Económico Europeo. Estas transferencias se realizan bajo las cláusulas contractuales
          tipo aprobadas por la Comisión Europea, garantizando un nivel de protección adecuado.
        </Text>

        {/* 6 */}
        <Text style={styles.sectionTitle}>6. Conservación de los datos</Text>
        <Text style={styles.body}>
          Conservamos tus datos mientras mantengas una cuenta activa en ParkShare. Tras la
          cancelación de tu cuenta:{'\n\n'}
          • Datos de cuenta: eliminados en 30 días.{'\n'}
          • Registros de transacciones: conservados 5 años (obligación fiscal).{'\n'}
          • Logs de seguridad: conservados 12 meses.
        </Text>

        {/* 7 */}
        <Text style={styles.sectionTitle}>7. Tus derechos (RGPD)</Text>
        <Text style={styles.body}>Tienes derecho a:</Text>
        <Text style={styles.bullet}>• <Text style={styles.bold}>Acceso:</Text> saber qué datos tenemos sobre ti.</Text>
        <Text style={styles.bullet}>• <Text style={styles.bold}>Rectificación:</Text> corregir datos inexactos.</Text>
        <Text style={styles.bullet}>• <Text style={styles.bold}>Supresión ("derecho al olvido"):</Text> eliminar tus datos cuando ya no sean necesarios.</Text>
        <Text style={styles.bullet}>• <Text style={styles.bold}>Portabilidad:</Text> recibir tus datos en formato estructurado.</Text>
        <Text style={styles.bullet}>• <Text style={styles.bold}>Limitación:</Text> restringir el tratamiento en ciertos casos.</Text>
        <Text style={styles.bullet}>• <Text style={styles.bold}>Oposición:</Text> oponerte al tratamiento basado en interés legítimo.</Text>
        <Text style={styles.body}>
          Para ejercer estos derechos, escríbenos a <Text style={styles.bold}>privacidad@parkshare.es</Text>.
          También puedes reclamar ante la Agencia Española de Protección de Datos (aepd.es).
        </Text>

        {/* 8 */}
        <Text style={styles.sectionTitle}>8. Seguridad</Text>
        <Text style={styles.body}>
          Aplicamos medidas técnicas y organizativas para proteger tus datos: cifrado en tránsito
          (HTTPS/TLS), reglas de seguridad en base de datos, autenticación con Firebase Auth y
          limitación de acceso por roles.
        </Text>

        {/* 9 */}
        <Text style={styles.sectionTitle}>9. Menores de edad</Text>
        <Text style={styles.body}>
          ParkShare no está dirigido a menores de 18 años. No recogemos conscientemente datos
          de menores. Si detectas que un menor ha creado una cuenta, contáctanos para eliminarla.
        </Text>

        {/* 10 */}
        <Text style={styles.sectionTitle}>10. Cambios en esta política</Text>
        <Text style={styles.body}>
          Podemos actualizar esta política para reflejar cambios legales o en el servicio.
          Te notificaremos por email o notificación push ante cambios significativos. La versión
          vigente siempre estará disponible en la app.
        </Text>

        <Text style={styles.contact}>
          ¿Preguntas? Escríbenos a privacidad@parkshare.es
        </Text>

        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <Text style={styles.backButtonText}>← Volver</Text>
        </TouchableOpacity>

        <View style={{ height: 40 }} />
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
  },
  updated: {
    fontSize: 12,
    color: '#999',
    marginBottom: 16,
    textAlign: 'right',
  },
  intro: {
    fontSize: 14,
    color: '#555',
    lineHeight: 22,
    marginBottom: 24,
    backgroundColor: '#fff',
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#4A90D9',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#222',
    marginTop: 24,
    marginBottom: 10,
  },
  body: {
    fontSize: 14,
    color: '#444',
    lineHeight: 22,
    marginBottom: 8,
  },
  bullet: {
    fontSize: 14,
    color: '#444',
    lineHeight: 22,
    marginBottom: 6,
    paddingLeft: 4,
  },
  bold: {
    fontWeight: '600',
    color: '#333',
  },
  contact: {
    fontSize: 14,
    color: '#4A90D9',
    textAlign: 'center',
    marginTop: 32,
    marginBottom: 16,
    fontWeight: '500',
  },
  backButton: {
    alignSelf: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#4A90D9',
    borderRadius: 10,
    marginTop: 8,
  },
  backButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
});
