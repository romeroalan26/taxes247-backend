const Request = require("../models/Request");
const { statusSteps } = require("../models/Request");

// Función para calcular ingresos totales
const calculateTotalRevenue = async () => {
  try {
    const result = await Request.aggregate([
      {
        $match: {
          isDeleted: false,
          status: { $in: ["Completada", "Pago recibido", "Pago programado"] },
        },
      },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$price" },
        },
      },
    ]);

    return result.length > 0 ? result[0].totalRevenue : 0;
  } catch (error) {
    console.error("Error calculando ingresos totales:", error);
    return 0;
  }
};

// Controlador de estadísticas
const getStatistics = async (req, res) => {
  try {
    // Conteo de estados
    const statusCounts = await Request.aggregate([
      { $match: { isDeleted: false } },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    // Convertir el resultado del aggregate a un objeto
    const statusCountsObj = statusCounts.reduce((acc, item) => {
      acc[item._id] = item.count;
      return acc;
    }, {});

    // Completar con ceros los estados que no tienen solicitudes
    statusSteps.forEach((step) => {
      if (!statusCountsObj[step.value]) {
        statusCountsObj[step.value] = 0;
      }
    });

    // Calcular ingresos totales
    const totalRevenue = await calculateTotalRevenue();

    // Conteo de solicitudes completadas y pendientes
    const completedRequests = await Request.countDocuments({
      status: { $in: ["Completada", "Pago recibido"] },
      isDeleted: false,
    });

    const pendingRequests = await Request.countDocuments({
      status: {
        $nin: ["Completada", "Pago recibido", "Cancelada", "Rechazada"],
      },
      isDeleted: false,
    });

    // Estadísticas adicionales
    const totalRequests = await Request.countDocuments({ isDeleted: false });
    const canceledRequests = await Request.countDocuments({
      status: "Cancelada",
      isDeleted: false,
    });
    const rejectedRequests = await Request.countDocuments({
      status: "Rechazada",
      isDeleted: false,
    });

    res.json({
      statusCounts: statusCountsObj,
      totalRevenue,
      completedRequests,
      pendingRequests,
      totalRequests,
      canceledRequests,
      rejectedRequests,
    });
  } catch (error) {
    console.error("Error al obtener estadísticas:", error);
    res
      .status(500)
      .json({ message: "Error al obtener estadísticas", error: error.message });
  }
};

module.exports = {
  getStatistics,
};
