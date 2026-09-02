const auditoriaRepository = require('./auditoria.repository');

class AuditoriaService {
  async listar(filters) {
    return auditoriaRepository.findAll(filters);
  }

  async contar(filters) {
    return auditoriaRepository.count(filters);
  }

  async obtener(id) {
    const movimiento = await auditoriaRepository.findById(id);
    if (!movimiento) {
      const error = new Error('Movimiento de auditoría no encontrado');
      error.status = 404;
      throw error;
    }
    return movimiento;
  }
}

module.exports = new AuditoriaService();