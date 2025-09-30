from app import app

if __name__ == '__main__':
    # Este bloco só é executado em desenvolvimento local, não com Gunicorn.
    app.run(debug=True, host='0.0.0.0')
