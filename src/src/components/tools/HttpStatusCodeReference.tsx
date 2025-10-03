import React from 'react';

const statusCodes = [
  { code: 100, message: 'Continue' },
  { code: 101, message: 'Switching Protocols' },
  { code: 200, message: 'OK' },
  { code: 201, message: 'Created' },
  { code: 202, message: 'Accepted' },
  { code: 204, message: 'No Content' },
  { code: 301, message: 'Moved Permanently' },
  { code: 302, message: 'Found' },
  { code: 304, message: 'Not Modified' },
  { code: 400, message: 'Bad Request' },
  { code: 401, message: 'Unauthorized' },
  { code: 403, message: 'Forbidden' },
  { code: 404, message: 'Not Found' },
  { code: 500, message: 'Internal Server Error' },
  { code: 502, message: 'Bad Gateway' },
  { code: 503, message: 'Service Unavailable' },
  { code: 504, message: 'Gateway Timeout' },
];

const HttpStatusCodeReference: React.FC = () => {
  return (
    <div className="p-4">
      <h2 className="text-lg font-semibold mb-2">HTTP Status Code Reference</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {statusCodes.map(({ code, message }) => (
          <div key={code} className="p-4 border rounded-md">
            <h3 className="font-bold text-lg">{code}</h3>
            <p>{message}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HttpStatusCodeReference;