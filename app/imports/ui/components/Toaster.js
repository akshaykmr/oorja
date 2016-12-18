import { Position, Toaster } from '@blueprintjs/core';

// SupremeToaster is the main app toaster. Dont think I would need more,
// export from this file if needed. SUPREME_TOASTER FTW 😎
const SupremeToaster = Toaster.create({
  className: 'supreme-toaster',
  position: Position.TOP,
});

export default SupremeToaster;
