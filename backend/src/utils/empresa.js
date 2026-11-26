function validarEmpresaActual(registro, empresaId, entidad = 'registro') {
  if (empresaId == null) return;

  const empresaActual = registro?.Uni_empresa_actual ?? registro?.Pla_empresa_actual;
  if (empresaActual == null || Number(empresaActual) !== Number(empresaId)) {
    const error = new Error(
      `La empresa propietaria conserva acceso de consulta, pero no puede modificar este ${entidad}; la administración corresponde a la empresa actual.`
    );
    error.status = 403;
    throw error;
  }
}

module.exports = { validarEmpresaActual };
