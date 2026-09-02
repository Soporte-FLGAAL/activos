const db = require('../config/database');

module.exports = async (req, res, next) => {
  try {
    const userId = req.user.userId;
    const [empresas] = await db.query(
      'SELECT UE_empresa FROM Usuario_Empresas WHERE UE_usuario = ?',
      [userId]
    );

    // Si tiene una sola empresa, la establecemos automáticamente
    if (empresas.length === 1) {
      req.empresaId = empresas[0].UE_empresa;
      return next();
    }

    // Si tiene varias, intentar determinar desde header/query/body/params
    const empresaSolicitada =
      req.headers['x-empresa-id'] ||
      req.query.empresaId ||
      req.body.empresaId ||
      req.params.empresaId;

    if (empresaSolicitada) {
      const pertenece = empresas.some(e => e.UE_empresa == empresaSolicitada);
      if (pertenece) {
        req.empresaId = empresaSolicitada;
      }
    }
    // No bloqueamos; si no se determina, req.empresaId queda undefined
    // Las rutas que requieran empresa deberán verificarlo explícitamente.
    next();
  } catch (err) {
    next(err);
  }
};