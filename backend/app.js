const express = require('express');
const cors = require('cors');
const logger = require('./middlewares/logger');
const errorHandler = require('./middlewares/errorHandler');
const initTables = require('./config/tables');

// Роуты
const puppiesRoutes = require('./routes/puppiesRoutes');

const app = express();

// Инициализация таблиц
initTables();

// Middleware
app.use(cors());
app.use(express.json());
app.use(logger);

// Подключение маршрутов
app.use('/puppies', puppiesRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Backend' });
});

// Обработчик ошибок
app.use(errorHandler);

module.exports = app;