export const error = (status = 400, message = 'Something went wrong') => ({
  status,
  message,
});


export const body = (status = 200, data = {}) => ({
  status,
  data,
});
