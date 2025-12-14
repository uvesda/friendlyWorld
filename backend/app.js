const express = require('express');
const cors = require('cors');
const logger = require('./middlewares/logger');
const errorHandler = require('./middlewares/errorHandler');
const initTables = require('./config/tables');
const cookieParser = require('cookie-parser');

// Роуты
const puppiesRoutes = require('./routes/puppiesRoutes');
const usersRoutes = require('./routes/usersRoutes');
const sessionsRoutes = require('./routes/sessionsRoutes');


const app = express();

// Инициализация таблиц
initTables();

// Middleware
app.use(cors());
app.use(express.json());
app.use(logger);
app.use(cookieParser());

// Подключение маршрутов
app.use('/puppies', puppiesRoutes);
app.use('/users', usersRoutes);
app.use('/sessions', sessionsRoutes);

app.get('/', (req, res) => {
  res.json({ message: 'Backend' });
});

// Обработчик ошибок
app.use(errorHandler);

module.exports = app;