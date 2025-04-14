import app from './config/app';
import { PORT } from './config/constants';

import routes from './routes/index';

app.use('/api', routes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
