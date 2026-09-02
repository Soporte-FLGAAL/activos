function getPagination(query) {
  const page = parseInt(query.page) || 1;
  const limit = parseInt(query.limit) || 10;
  const offset = (page - 1) * limit;
  return { page, limit, offset };
}

/**
 * Aplica paginación a un listado.
 * @param {Function} listMethod - Función que recibe filtros con limit/offset y devuelve un array.
 * @param {Function} countMethod - Función que recibe filtros (sin limit/offset) y devuelve el total.
 * @param {Object} query - Query params de la petición.
 * @param {Object} filters - Filtros adicionales (sin paginación).
 * @returns {Promise<{data: Array, pagination: {page, limit, total, totalPages}}>}
 */
async function paginate(listMethod, countMethod, query, filters = {}) {
  const { page, limit, offset } = getPagination(query);
  const [data, total] = await Promise.all([
    listMethod({ ...filters, limit, offset }),
    countMethod(filters),
  ]);
  return {
    data,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}

module.exports = { getPagination, paginate };