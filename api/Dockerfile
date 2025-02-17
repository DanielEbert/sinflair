FROM python:3.11

WORKDIR /

EXPOSE 8080

COPY ./requirements.txt /requirements.txt

RUN pip install --no-cache-dir -r /requirements.txt

CMD ["python", "-m", "uvicorn", "src.main:app", "--host=0.0.0.0", "--port=8080"]
