import { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import api from '../api/client.js';

export default function AdminDashboardPage() {
  const [days, setDays] = useState([]);
  const [orders, setOrders] = useState([]);
  const [logs, setLogs] = useState([]);
  const [logTotal, setLogTotal] = useState(0);
  const [logHasMore, setLogHasMore] = useState(false);
  const [logFilter, setLogFilter] = useState('all');
  const [logSourceFilter, setLogSourceFilter] = useState('all');
  const [logRange, setLogRange] = useState('24h');
  const [logLimit, setLogLimit] = useState('1000');
  const [logSearch, setLogSearch] = useState('');
  const [logTelegramId, setLogTelegramId] = useState('');
  const [copyStatus, setCopyStatus] = useState('');
  const [loading, setLoading] = useState(true);
  const [adminMessage, setAdminMessage] = useState('');
  const [adminBusyKey, setAdminBusyKey] = useState('');
  const [imageDrafts, setImageDrafts] = useState({});

  const [dayForm, setDayForm] = useState({ date: '' });

  const [itemForm, setItemForm] = useState({
    dayId: '',
    name: '',
    price: '',
    quantity: '',
    type: 'meal',
    imageUrl: '',
  });

  const [editingOrderId, setEditingOrderId] = useState(null);
  const [editOrderForm, setEditOrderForm] = useState({
    status: 'CONFIRMED',
  });

  const fetchData = async () => {
    try {
      setLoading(true);

      const [daysRes, ordersRes] = await Promise.all([
        api.get('/admin/menu/days'),
        api.get('/admin/orders'),
      ]);

      setDays(Array.isArray(daysRes.data) ? daysRes.data : []);
      setOrders(Array.isArray(ordersRes.data) ? ordersRes.data : []);
      const drafts = {};

      (Array.isArray(daysRes.data) ? daysRes.data : []).forEach((day) => {
        (day.items || []).forEach((item) => {
          drafts[item.id] = item.imageUrl || '';
        });
      });

      setImageDrafts(drafts);
    } catch (error) {
      console.error('ADMIN FETCH ERROR:', error?.response?.data || error.message);
      setAdminMessage(error?.response?.data?.message || 'Failed to load admin data');
    } finally {
      setLoading(false);
    }
  };

  const imageFileToDataUrl = (file) => {
    return new Promise((resolve, reject) => {
      if (!file) {
        resolve('');
        return;
      }

      if (!file.type.startsWith('image/')) {
        reject(new Error('Выберите файл изображения'));
        return;
      }

      const reader = new FileReader();

      reader.onload = () => {
        const image = new Image();

        image.onload = () => {
          const maxSide = 900;
          const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
          const width = Math.max(1, Math.round(image.width * scale));
          const height = Math.max(1, Math.round(image.height * scale));
          const canvas = document.createElement('canvas');
          const context = canvas.getContext('2d');

          canvas.width = width;
          canvas.height = height;
          context.drawImage(image, 0, 0, width, height);

          resolve(canvas.toDataURL('image/jpeg', 0.82));
        };

        image.onerror = () => reject(new Error('Не удалось прочитать изображение'));
        image.src = reader.result;
      };

      reader.onerror = () => reject(new Error('Не удалось загрузить файл'));
      reader.readAsDataURL(file);
    });
  };

  const setCreateItemImage = async (file) => {
    try {
      const imageData = await imageFileToDataUrl(file);
      setItemForm((prev) => ({ ...prev, imageUrl: imageData }));
      setAdminMessage(imageData ? 'Изображение выбрано' : '');
    } catch (error) {
      setAdminMessage(error.message || 'Не удалось загрузить изображение');
    }
  };

  const setExistingItemImage = async (itemId, file) => {
    try {
      const imageData = await imageFileToDataUrl(file);
      setImageDrafts((prev) => ({ ...prev, [itemId]: imageData }));
      setAdminMessage(imageData ? 'Изображение выбрано, нажмите "Сохранить фото"' : '');
    } catch (error) {
      setAdminMessage(error.message || 'Не удалось загрузить изображение');
    }
  };

  const fetchLogs = async () => {
    try {
      const params = new URLSearchParams({
        limit: logLimit,
        range: logRange,
        level: logFilter,
        source: logSourceFilter,
      });

      if (logSearch.trim()) params.set('search', logSearch.trim());
      if (logTelegramId.trim()) params.set('telegramUserId', logTelegramId.trim());

      const res = await api.get(`/admin/diagnostics?${params.toString()}`);
      setLogs(Array.isArray(res.data?.logs) ? res.data.logs : []);
      setLogTotal(Number(res.data?.total || 0));
      setLogHasMore(Boolean(res.data?.hasMore));
    } catch (error) {
      console.error('ADMIN LOGS FETCH ERROR:', error?.response?.data || error.message);
    }
  };

  const clearLogs = async () => {
    try {
      await api.delete('/admin/diagnostics');
      setLogs([]);
      setLogTotal(0);
      setLogHasMore(false);
    } catch (error) {
      console.error('ADMIN LOGS CLEAR ERROR:', error?.response?.data || error.message);
    }
  };

  useEffect(() => {
    fetchData();
    fetchLogs();
  }, []);

  const totalOrders = orders.length;
  const totalRevenue = orders.reduce(
    (sum, order) => sum + Number(order.totalAmount || 0),
    0
  );
  const totalItems = orders.reduce(
    (sum, order) => sum + (Array.isArray(order.items) ? order.items.length : 0),
    0
  );

  const sortedMenuDays = useMemo(() => {
    return [...days].sort((a, b) => String(a.date).localeCompare(String(b.date)));
  }, [days]);

  const filteredLogs = useMemo(() => {
    return logs;
  }, [logs]);

  const formatLogLine = (log) => {
    const time = log.time ? new Date(log.time).toLocaleString() : '-';
    const meta = [
      time,
      (log.level || 'info').toUpperCase(),
      log.source || '-',
      log.status || '',
      log.telegramUserId ? `tg:${log.telegramUserId}` : '',
    ].filter(Boolean).join(' | ');

    return `${meta}\n${log.message || log.path || '-'}\n`;
  };

  const copyVisibleLogs = async () => {
    const text = filteredLogs.map(formatLogLine).join('\n');

    try {
      await navigator.clipboard.writeText(text || 'Нет видимых логов.');
      setCopyStatus('Логи скопированы');
    } catch {
      setCopyStatus('Не удалось скопировать');
    }
  };

  const exportVisibleLogs = () => {
    const rows = filteredLogs.map((log) => ({
      time: log.time || '',
      level: log.level || '',
      source: log.source || '',
      method: log.method || '',
      path: log.path || '',
      status: log.status || '',
      durationMs: log.durationMs || '',
      telegramUserId: log.telegramUserId || '',
      message: log.message || '',
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Logs');
    XLSX.writeFile(workbook, 'diagnostic-logs.xlsx');
  };

  const createDay = async (e) => {
    e.preventDefault();

    try {
      await api.post('/admin/menu/days', dayForm);
      setDayForm({ date: '' });
      await fetchData();
    } catch (error) {
      console.error('CREATE DAY ERROR:', error?.response?.data || error.message);
    }
  };

  const createItem = async (e) => {
    e.preventDefault();

    try {
      await api.post('/admin/menu/items', {
        ...itemForm,
        dayId: itemForm.dayId,
        price: Number(itemForm.price),
        quantity: Number(itemForm.quantity),
      });

      setItemForm({
        dayId: '',
        name: '',
        price: '',
        quantity: '',
        type: 'meal',
        imageUrl: '',
      });

      await fetchData();
    } catch (error) {
      console.error('CREATE ITEM ERROR:', error?.response?.data || error.message);
    }
  };

  const saveItemImage = async (itemId) => {
    try {
      setAdminBusyKey(`image:${itemId}`);
      setAdminMessage('');
      await api.patch(`/admin/menu/items/${itemId}`, {
        imageUrl: (imageDrafts[itemId] || '').trim(),
      });
      setAdminMessage('Изображение сохранено');
      await fetchData();
    } catch (error) {
      console.error('SAVE IMAGE ERROR:', error?.response?.data || error.message);
      setAdminMessage(error?.response?.data?.message || 'Не удалось сохранить изображение');
    } finally {
      setAdminBusyKey('');
    }
  };

  const deleteDay = async (dayId) => {
    const day = days.find((item) => item.id === dayId);
    const label = day?.date || 'этот день';

    if (!window.confirm(`Убрать день меню ${label} из активного меню? Существующие заказы сохранятся.`)) {
      return;
    }

    try {
      setAdminBusyKey(`day:${dayId}`);
      setAdminMessage('');
      await api.delete(`/admin/menu/days/${dayId}`);
      setAdminMessage('День меню удалён');
      await fetchData();
    } catch (error) {
      console.error('DELETE DAY ERROR:', error?.response?.data || error.message);
      setAdminMessage(error?.response?.data?.message || 'Не удалось удалить день меню');
    } finally {
      setAdminBusyKey('');
    }
  };

  const deleteItem = async (dayId, itemId) => {
    if (!window.confirm('Отключить эту позицию меню? Существующие заказы сохранятся.')) {
      return;
    }

    try {
      setAdminBusyKey(`item:${itemId}`);
      setAdminMessage('');
      await api.delete(`/admin/menu/items/${itemId}`);
      setAdminMessage('Позиция меню отключена');
      await fetchData();
    } catch (error) {
      console.error('DELETE ITEM ERROR:', error?.response?.data || error.message);
      setAdminMessage(error?.response?.data?.message || 'Не удалось удалить позицию меню');
    } finally {
      setAdminBusyKey('');
    }
  };

  const restoreItem = async (itemId) => {
    try {
      setAdminBusyKey(`item:${itemId}`);
      setAdminMessage('');
      await api.patch(`/admin/menu/items/${itemId}`, { isActive: true });
      setAdminMessage('Позиция меню восстановлена');
      await fetchData();
    } catch (error) {
      console.error('RESTORE ITEM ERROR:', error?.response?.data || error.message);
      setAdminMessage(error?.response?.data?.message || 'Не удалось восстановить позицию меню');
    } finally {
      setAdminBusyKey('');
    }
  };

  const deleteOrder = async (orderId) => {
    if (!window.confirm('Удалить этот заказ? Доступное количество позиций будет восстановлено.')) {
      return;
    }

    try {
      setAdminBusyKey(`order:${orderId}`);
      setAdminMessage('');
      await api.delete(`/admin/orders/${orderId}`);
      setAdminMessage('Заказ удалён');
      await fetchData();
    } catch (error) {
      console.error('DELETE ORDER ERROR:', error?.response?.data || error.message);
      setAdminMessage(error?.response?.data?.message || 'Не удалось удалить заказ');
    } finally {
      setAdminBusyKey('');
    }
  };

  const startEditOrder = (order) => {
    setEditingOrderId(order.id);
    setEditOrderForm({
      status: order.status || 'CONFIRMED',
    });
  };

  const cancelEditOrder = () => {
    setEditingOrderId(null);
    setEditOrderForm({
      status: 'CONFIRMED',
    });
  };

  const saveEditOrder = async () => {
    try {
      await api.put(`/admin/orders/${editingOrderId}`, {
        status: editOrderForm.status,
      });

      cancelEditOrder();
      await fetchData();
    } catch (error) {
      console.error('SAVE ORDER ERROR:', error?.response?.data || error.message);
    }
  };

  const exportOrdersXLS = () => {
    const rows = orders.map((order) => ({
      orderId: order.id,
      customerName: order.customerName || '',
      telegramId: order.telegramId || '',
      status: order.status || '',
      createdAt: order.createdAt || '',
      totalAmount: order.totalAmount || 0,
      items: (order.items || [])
        .map(
          (item) =>
            `${item.name || item?.menuItem?.name || ''} x${item.quantity || 0} (${item.type || item?.menuItem?.type || 'meal'})`
        )
        .join(', '),
    }));

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Заказы');
    XLSX.writeFile(workbook, 'orders.xlsx');
  };

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Панель администратора</h1>
          <p style={styles.subtitle}>Управление меню и заказами</p>
        </div>

        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button
            onClick={() => {
              fetchData();
              fetchLogs();
            }}
            style={styles.primaryButton}
          >
            Обновить
          </button>
          <button onClick={exportOrdersXLS} style={styles.primaryButton}>
            Скачать XLS
          </button>
        </div>
      </div>

      {adminMessage ? (
        <div style={styles.adminNotice}>
          {adminMessage}
        </div>
      ) : null}

      <div style={styles.section}>
        <div style={styles.sectionHeader}>
          <div>
            <h2 style={styles.sectionTitle}>Журнал событий</h2>
            <p style={styles.sectionSubtitle}>
              Запросы сервера и ошибки сохраняются в базе данных для проверки.
            </p>
          </div>

          <div style={styles.logActions}>
            <select
              value={logRange}
              onChange={(e) => setLogRange(e.target.value)}
              style={styles.compactSelect}
            >
              <option value="1h">За последний час</option>
              <option value="24h">За день</option>
              <option value="7d">За неделю</option>
              <option value="30d">За месяц</option>
            </select>

            <select
              value={logLimit}
              onChange={(e) => setLogLimit(e.target.value)}
              style={styles.compactSelect}
            >
              <option value="250">Показать 250</option>
              <option value="500">Показать 500</option>
              <option value="1000">Показать 1000</option>
              <option value="5000">Показать 5000</option>
            </select>

            <select
              value={logFilter}
              onChange={(e) => setLogFilter(e.target.value)}
              style={styles.compactSelect}
            >
              <option value="all">Все</option>
              <option value="error">Ошибки</option>
              <option value="warn">Предупреждения</option>
              <option value="info">Info</option>
            </select>

            <select
              value={logSourceFilter}
              onChange={(e) => setLogSourceFilter(e.target.value)}
              style={styles.compactSelect}
            >
              <option value="all">Все источники</option>
              <option value="request">Запросы</option>
              <option value="server">Сервер</option>
            </select>

            <button onClick={fetchLogs} style={styles.primaryButtonSmall}>
              Применить
            </button>
            <button onClick={copyVisibleLogs} style={styles.primaryButtonSmall}>
              Скопировать
            </button>
            <button onClick={exportVisibleLogs} style={styles.primaryButtonSmall}>
              Экспорт XLS
            </button>
            <button onClick={clearLogs} style={styles.smallDangerButton}>
              Очистить
            </button>
          </div>
        </div>

        <div style={styles.logSearchRow}>
          <input
            type="text"
            value={logSearch}
            onChange={(e) => setLogSearch(e.target.value)}
            placeholder="Поиск по сообщению или пути"
            style={styles.logInput}
          />
          <input
            type="text"
            value={logTelegramId}
            onChange={(e) => setLogTelegramId(e.target.value)}
            placeholder="Telegram ID"
            style={styles.logInput}
          />
          <span style={styles.logCount}>
            Показано {filteredLogs.length} из {logTotal}
            {logHasMore ? ` - лимит ${logLimit}` : ''}
            {copyStatus ? ` - ${copyStatus}` : ''}
          </span>
        </div>

        <div style={styles.logPanel}>
          {filteredLogs.length === 0 ? (
            <div style={styles.emptyLog}>Логов пока нет.</div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} style={styles.logRow}>
                <div style={styles.logMeta}>
                  <span style={{ ...styles.logBadge, ...styles[`logBadge_${log.level}`] }}>
                    {log.level || 'info'}
                  </span>
                  <span>{log.source || '-'}</span>
                  <span>{log.time ? new Date(log.time).toLocaleString() : '-'}</span>
                  {log.status ? <span>{log.status}</span> : null}
                  {log.telegramUserId ? <span>tg:{log.telegramUserId}</span> : null}
                </div>

                <pre style={styles.logMessage}>{log.message || log.path || '-'}</pre>
              </div>
            ))
          )}
        </div>
      </div>

      <div style={styles.statsGrid}>
        <div style={styles.statCard}>
          <div style={styles.statLabel}>Дни меню</div>
          <div style={styles.statValue}>{days.length}</div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statLabel}>Заказы</div>
          <div style={styles.statValue}>{totalOrders}</div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statLabel}>Заказанные позиции</div>
          <div style={styles.statValue}>{totalItems}</div>
        </div>

        <div style={styles.statCard}>
          <div style={styles.statLabel}>Выручка</div>
          <div style={styles.statValue}>{totalRevenue}</div>
        </div>
      </div>

      <div style={styles.formGrid}>
        <div style={styles.panel}>
          <h2 style={styles.panelTitle}>Создать день</h2>

          <form onSubmit={createDay} style={styles.form}>
            <input
              type="date"
              value={dayForm.date}
              onChange={(e) => setDayForm({ date: e.target.value })}
              style={styles.input}
              required
            />

            <button type="submit" style={styles.primaryButton}>
              Создать день
            </button>
          </form>
        </div>

        <div style={styles.panel}>
          <h2 style={styles.panelTitle}>Создать позицию</h2>

          <form onSubmit={createItem} style={styles.form}>
            <select
              value={itemForm.dayId}
              onChange={(e) =>
                setItemForm((prev) => ({ ...prev, dayId: e.target.value }))
              }
              style={styles.input}
              required
            >
              <option value="">Выберите день</option>
              {sortedMenuDays.map((day) => (
                <option key={day.id} value={day.id}>
                  {day.date}
                </option>
              ))}
            </select>

            <input
              type="text"
              placeholder="Название"
              value={itemForm.name}
              onChange={(e) =>
                setItemForm((prev) => ({ ...prev, name: e.target.value }))
              }
              style={styles.input}
              required
            />

            <input
              type="number"
              placeholder="Цена"
              value={itemForm.price}
              onChange={(e) =>
                setItemForm((prev) => ({ ...prev, price: e.target.value }))
              }
              style={styles.input}
              required
            />

            <input
              type="number"
              placeholder="Количество"
              value={itemForm.quantity}
              onChange={(e) =>
                setItemForm((prev) => ({ ...prev, quantity: e.target.value }))
              }
              style={styles.input}
              required
            />

            <input
              type="file"
              accept="image/*"
              onChange={(e) => setCreateItemImage(e.target.files?.[0])}
              style={styles.input}
            />

            {itemForm.imageUrl ? (
              <img src={itemForm.imageUrl} alt="Предпросмотр" style={styles.createImagePreview} />
            ) : null}

            <select
              value={itemForm.type}
              onChange={(e) =>
                setItemForm((prev) => ({ ...prev, type: e.target.value }))
              }
              style={styles.input}
            >
              <option value="meal">Еда</option>
              <option value="coffee">Кофе</option>
              <option value="drink">Напиток</option>
              <option value="dessert">Десерт</option>
            </select>

            <button type="submit" style={styles.primaryButton}>
              Создать позицию
            </button>
          </form>
        </div>
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Дни меню</h2>

        {sortedMenuDays.length === 0 ? (
          <div style={styles.emptyCard}>Дней меню пока нет.</div>
        ) : (
          <div style={styles.cardsGrid}>
            {sortedMenuDays.map((day) => (
              <div key={day.id} style={styles.dayCard}>
                <div style={styles.cardTop}>
                  <strong style={styles.cardTitle}>{day.date}</strong>
                  <button
                    type="button"
                    onClick={() => deleteDay(day.id)}
                    disabled={adminBusyKey === `day:${day.id}`}
                    style={styles.dangerButton}
                  >
                    {adminBusyKey === `day:${day.id}` ? 'Удаление...' : 'Удалить день'}
                  </button>
                </div>

                <div style={styles.itemsWrap}>
                  {(day.items || []).length === 0 ? (
                    <p style={styles.emptyText}>Позиций пока нет.</p>
                  ) : (
                    (day.items || []).map((item) => (
                      <div key={item.id} style={styles.itemRow}>
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            style={styles.itemThumb}
                          />
                        ) : (
                          <div style={styles.itemThumbEmpty}>Нет фото</div>
                        )}

                        <div>
                          {item.name}{' '}
                          <span style={styles.typeBadge}>({item.type || 'meal'})</span>
                          {!item.isActive ? (
                            <span style={styles.inactiveBadge}>Отключено</span>
                          ) : null}
                        </div>

                        <div style={styles.itemActions}>
                          <span>{item.price}</span>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={(e) => setExistingItemImage(item.id, e.target.files?.[0])}
                            style={styles.fileInput}
                          />
                          <button
                            type="button"
                            onClick={() => saveItemImage(item.id)}
                            disabled={adminBusyKey === `image:${item.id}`}
                            style={styles.primaryButtonSmall}
                          >
                            {adminBusyKey === `image:${item.id}` ? 'Сохранение...' : 'Сохранить фото'}
                          </button>
                          {item.isActive ? (
                            <button
                              type="button"
                              onClick={() => deleteItem(day.id, item.id)}
                              disabled={adminBusyKey === `item:${item.id}`}
                              style={styles.smallDangerButton}
                            >
                              {adminBusyKey === `item:${item.id}` ? 'Удаление...' : 'Удалить позицию'}
                            </button>
                          ) : (
                            <button
                              type="button"
                              onClick={() => restoreItem(item.id)}
                              disabled={adminBusyKey === `item:${item.id}`}
                              style={styles.primaryButtonSmall}
                            >
                              {adminBusyKey === `item:${item.id}` ? 'Восстановление...' : 'Восстановить'}
                            </button>
                          )}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={styles.section}>
        <h2 style={styles.sectionTitle}>Заказы</h2>

        {loading ? (
          <div style={styles.emptyCard}>Загрузка...</div>
        ) : orders.length === 0 ? (
          <div style={styles.emptyCard}>Заказов пока нет.</div>
        ) : (
          <div style={styles.orderList}>
            {orders.map((order) => (
              <div key={order.id} style={styles.orderCard}>
                <div style={styles.cardTop}>
                  <strong style={styles.cardTitle}>Заказ #{order.id}</strong>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button
                      type="button"
                      onClick={() => startEditOrder(order)}
                      style={styles.primaryButtonSmall}
                    >
                      Изменить
                    </button>

                    <button
                      type="button"
                      onClick={() => deleteOrder(order.id)}
                      disabled={adminBusyKey === `order:${order.id}`}
                      style={styles.dangerButton}
                    >
                      {adminBusyKey === `order:${order.id}` ? 'Удаление...' : 'Удалить'}
                    </button>
                  </div>
                </div>

                <div style={styles.orderItems}>
                  {(order.items || []).map((item) => (
                    <div key={item.id} style={styles.orderItemRow}>
                      <span>
                        {item.name || item?.menuItem?.name || ''}
                        {' '}
                        <span style={styles.typeBadge}>
                          ({item.type || item?.menuItem?.type || 'meal'})
                        </span>
                      </span>
                      <span>x{item.quantity}</span>
                    </div>
                  ))}
                </div>

                <div style={styles.orderMetaRow}>
                  <span style={styles.metaPill}>{order.customerName || '-'}</span>
                  <span style={styles.metaPill}>{order.status || 'CONFIRMED'}</span>
                  <span style={styles.metaPill}>{order.totalAmount || 0} so'm</span>
                  <span style={styles.metaPill}>
                    {order.createdAt
                      ? new Date(order.createdAt).toLocaleString()
                      : '-'}
                  </span>
                </div>

                {editingOrderId === order.id && (
                  <div style={styles.editBox}>
                    <select
                      value={editOrderForm.status}
                      onChange={(e) =>
                        setEditOrderForm((prev) => ({
                          ...prev,
                          status: e.target.value,
                        }))
                      }
                      style={styles.input}
                    >
                      <option value="PENDING">Ожидает</option>
                      <option value="CONFIRMED">Подтверждён</option>
                      <option value="CANCELLED">Отменён</option>
                    </select>

                    <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                      <button onClick={saveEditOrder} style={styles.primaryButton}>
                        Сохранить заказ
                      </button>
                      <button onClick={cancelEditOrder} style={styles.smallDangerButton}>
                        Отмена
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: '100vh',
    padding: '24px',
    background: 'linear-gradient(180deg, #f7fbff 0%, #eef6ff 100%)',
    color: '#16324f',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '16px',
    marginBottom: '24px',
    flexWrap: 'wrap',
  },
  title: {
    margin: 0,
    fontSize: '32px',
    fontWeight: 800,
  },
  subtitle: {
    margin: '6px 0 0 0',
    color: '#5b708a',
  },
  adminNotice: {
    background: '#ffffff',
    color: '#16324f',
    border: '1px solid #d9e4f1',
    borderRadius: '12px',
    padding: '12px 14px',
    marginBottom: '16px',
    fontWeight: 700,
    boxShadow: '0 8px 18px rgba(0,0,0,0.05)',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  statCard: {
    background: '#ffffff',
    borderRadius: '18px',
    padding: '18px',
    boxShadow: '0 10px 24px rgba(0,0,0,0.06)',
  },
  statLabel: {
    color: '#5b708a',
    fontSize: '14px',
    marginBottom: '8px',
  },
  statValue: {
    fontSize: '28px',
    fontWeight: 800,
  },
  formGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '20px',
    marginBottom: '24px',
  },
  panel: {
    background: '#ffffff',
    borderRadius: '20px',
    padding: '20px',
    boxShadow: '0 10px 24px rgba(0,0,0,0.06)',
  },
  panelTitle: {
    marginTop: 0,
    marginBottom: '16px',
    fontSize: '22px',
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '12px',
  },
  input: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: '12px',
    border: '1px solid #d9e4f1',
    background: '#fff',
    boxSizing: 'border-box',
    fontSize: '14px',
  },
  textarea: {
    width: '100%',
    padding: '12px 14px',
    borderRadius: '12px',
    border: '1px solid #d9e4f1',
    background: '#fff',
    boxSizing: 'border-box',
    fontSize: '14px',
    resize: 'vertical',
  },
  primaryButton: {
    border: 'none',
    background: '#1f7aec',
    color: '#fff',
    padding: '12px 16px',
    borderRadius: '12px',
    cursor: 'pointer',
    fontWeight: 700,
  },
  primaryButtonSmall: {
    border: 'none',
    background: '#1f7aec',
    color: '#fff',
    padding: '8px 12px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: 700,
  },
  dangerButton: {
    border: 'none',
    background: '#ff5b61',
    color: '#fff',
    padding: '8px 12px',
    borderRadius: '10px',
    cursor: 'pointer',
    fontWeight: 700,
  },
  smallDangerButton: {
    border: 'none',
    background: '#ff7b81',
    color: '#fff',
    padding: '6px 10px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: '12px',
  },
  section: {
    marginBottom: '24px',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: '14px',
    flexWrap: 'wrap',
    marginBottom: '14px',
  },
  sectionTitle: {
    fontSize: '24px',
    margin: 0,
  },
  sectionSubtitle: {
    margin: '6px 0 0 0',
    color: '#5b708a',
    fontSize: '13px',
  },
  logActions: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
    alignItems: 'center',
  },
  compactSelect: {
    padding: '9px 12px',
    borderRadius: '10px',
    border: '1px solid #d9e4f1',
    background: '#ffffff',
    color: '#16324f',
    fontWeight: 700,
  },
  logSearchRow: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '10px',
    alignItems: 'center',
    marginBottom: '10px',
  },
  logInput: {
    width: '100%',
    padding: '10px 12px',
    borderRadius: '10px',
    border: '1px solid #d9e4f1',
    background: '#ffffff',
    color: '#16324f',
    boxSizing: 'border-box',
    fontSize: '13px',
  },
  logCount: {
    color: '#5b708a',
    fontSize: '13px',
    fontWeight: 700,
    whiteSpace: 'nowrap',
  },
  logPanel: {
    background: '#0f1c2e',
    borderRadius: '18px',
    padding: '12px',
    color: '#d7e5f8',
    maxHeight: '360px',
    overflowY: 'auto',
    boxShadow: '0 10px 24px rgba(0,0,0,0.10)',
  },
  logRow: {
    borderBottom: '1px solid rgba(255,255,255,0.08)',
    padding: '10px 4px',
  },
  logMeta: {
    display: 'flex',
    gap: '8px',
    alignItems: 'center',
    flexWrap: 'wrap',
    color: '#9fb4cd',
    fontSize: '12px',
    marginBottom: '6px',
  },
  logBadge: {
    borderRadius: '999px',
    padding: '3px 8px',
    color: '#ffffff',
    fontWeight: 800,
    textTransform: 'uppercase',
    fontSize: '11px',
    background: '#52708f',
  },
  logBadge_info: {
    background: '#2b8be8',
  },
  logBadge_warn: {
    background: '#d98b14',
  },
  logBadge_error: {
    background: '#e5484d',
  },
  logMessage: {
    margin: 0,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
    fontSize: '12px',
    lineHeight: 1.45,
  },
  emptyLog: {
    color: '#9fb4cd',
    padding: '18px',
    textAlign: 'center',
  },
  cardsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
    gap: '16px',
  },
  dayCard: {
    background: '#ffffff',
    borderRadius: '18px',
    padding: '18px',
    boxShadow: '0 10px 24px rgba(0,0,0,0.06)',
  },
  orderCard: {
    background: '#ffffff',
    borderRadius: '18px',
    padding: '18px',
    boxShadow: '0 10px 24px rgba(0,0,0,0.06)',
    marginBottom: '16px',
  },
  cardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    flexWrap: 'wrap',
    marginBottom: '12px',
  },
  cardTitle: {
    fontSize: '18px',
  },
  itemsWrap: {
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
  },
  itemRow: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: '12px',
    background: '#f7fbff',
    padding: '10px 12px',
    borderRadius: '12px',
    flexWrap: 'wrap',
  },
  itemThumb: {
    width: '64px',
    height: '64px',
    objectFit: 'cover',
    borderRadius: '12px',
    background: '#e8f2fb',
  },
  itemThumbEmpty: {
    width: '64px',
    height: '64px',
    display: 'grid',
    placeItems: 'center',
    borderRadius: '12px',
    background: '#e8f2fb',
    color: '#70839b',
    fontSize: '11px',
    fontWeight: 800,
    textAlign: 'center',
  },
  itemActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    flexWrap: 'wrap',
  },
  fileInput: {
    minWidth: '180px',
    maxWidth: '260px',
    flex: '1 1 180px',
    padding: '8px 10px',
    borderRadius: '10px',
    border: '1px solid #d9e4f1',
    background: '#ffffff',
    color: '#16324f',
    boxSizing: 'border-box',
    fontSize: '13px',
  },
  createImagePreview: {
    width: '96px',
    height: '96px',
    objectFit: 'cover',
    borderRadius: '14px',
    background: '#e8f2fb',
  },
  typeBadge: {
    color: '#5b708a',
  },
  inactiveBadge: {
    display: 'inline-block',
    marginLeft: '8px',
    color: '#8a4b00',
    background: '#fff0cf',
    borderRadius: '999px',
    padding: '3px 8px',
    fontSize: '11px',
    fontWeight: 800,
  },
  emptyText: {
    margin: 0,
    color: '#70839b',
  },
  emptyCard: {
    background: '#ffffff',
    borderRadius: '18px',
    padding: '18px',
    color: '#70839b',
    boxShadow: '0 10px 24px rgba(0,0,0,0.06)',
  },
  orderList: {
    display: 'flex',
    flexDirection: 'column',
  },
  orderItems: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    marginBottom: '12px',
  },
  orderItemRow: {
    display: 'flex',
    justifyContent: 'space-between',
    gap: '12px',
    background: '#f7fbff',
    padding: '10px 12px',
    borderRadius: '12px',
  },
  orderMetaRow: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
  },
  metaPill: {
    background: '#eef4fb',
    padding: '8px 12px',
    borderRadius: '999px',
    fontSize: '13px',
    color: '#44576d',
  },
  editBox: {
    marginTop: '14px',
    display: 'flex',
    flexDirection: 'column',
    gap: '10px',
    background: '#f7fbff',
    padding: '14px',
    borderRadius: '14px',
  },
};
