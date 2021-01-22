FROM python:3.9

COPY requirements.txt /tmp/requirements.txt

RUN pip install -r /tmp/requirements.txt && rm /tmp/requirements.txt

COPY setup-build-matrix.py /usr/local/bin/

ENTRYPOINT ["setup-build-matrix.py"]
