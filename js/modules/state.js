// ========================================
// 📊 ESTADO GLOBAL DE LA APLICACIÓN
// ========================================

// === DATOS PRINCIPALES ===
export let products = [];
export let clients = [];
export let sales = [];
export let debts = [];
export let movements = [];
export let cart = [];

// === ESTADO DE LA APLICACIÓN ===
export let currentClientId = null;
export let inventoryViewMode = 'grid';
export let clientsViewMode = 'grid';

// === GESTIÓN DE POLLOS ===
export let chickenSales = [];
export let pricePerPound = 0;
export let costPerPound = 0;

// === CONFIGURACIÓN DE VISTAS ===
export let movementsViewMode = 'list';
export let currentMovementFilter = 'today';
export let currentChartType = 'trend';
export let movementCharts = {};
export let mainChart = null;
export let movementsViewInitialized = false;

// === FUNCIONES PARA ACTUALIZAR ESTADO ===
export function setProducts(newProducts) { products = newProducts; }
export function setClients(newClients) { clients = newClients; }
export function setSales(newSales) { sales = newSales; }
export function setDebts(newDebts) { debts = newDebts; }
export function setMovements(newMovements) { movements = newMovements; }
export function setCart(newCart) { cart = newCart; }
export function setChickenSales(newChickenSales) { chickenSales = newChickenSales; }
export function setPricePerPound(price) { pricePerPound = price; }
export function setCostPerPound(cost) { costPerPound = cost; }
export function setCurrentClientId(id) { currentClientId = id; }
export function setInventoryViewMode(mode) { inventoryViewMode = mode; }
export function setClientsViewMode(mode) { clientsViewMode = mode; }
export function setMovementsViewMode(mode) { movementsViewMode = mode; }
export function setCurrentMovementFilter(filter) { currentMovementFilter = filter; }
export function setCurrentChartType(type) { currentChartType = type; }
export function setMainChart(chart) { mainChart = chart; }