FROM eosio/builder
ARG branch=master
ARG symbol=SYS

RUN git clone -b $branch https://github.com/EOSIO/eos.git --recursive
RUN cd eos && echo "$branch:$(git rev-parse HEAD)" > /etc/eosio-version
RUN cd eos && cmake -H. -B"/opt/eosio" -GNinja -DCMAKE_BUILD_TYPE=Release -DWASM_ROOT=/opt/wasm -DCMAKE_CXX_COMPILER=clang++ -DCMAKE_C_COMPILER=clang -DCMAKE_INSTALL_PREFIX=/opt/eosio  -DSecp256k1_ROOT_DIR=/usr/local -DBUILD_MONGO_DB_PLUGIN=true -DCORE_SYMBOL_NAME=$symbol
RUN cd eos && cmake --build /opt/eosio --target install
RUN mv /eos/Docker/config.ini / && mv /opt/eosio/contracts /contracts && mv /eos/Docker/nodeosd.sh /opt/eosio/bin/nodeosd.sh && rm -rf /eos
RUN git config --global http.postBuffer 1048576000 && git clone --recursive https://github.com/eosio/eosio.wasmsdk
RUN cd eosio.wasmsdk && ./build.sh SYS && ./install.sh

RUN apt-get update && DEBIAN_FRONTEND=noninteractive apt-get -y install openssl ca-certificates vim psmisc python3-pip && rm -rf /var/lib/apt/lists/*
RUN pip3 install numpy
ENV EOSIO_ROOT=/opt/eosio
RUN chmod +x /opt/eosio/bin/nodeosd.sh
ENV LD_LIBRARY_PATH /usr/local/lib
VOLUME /opt/eosio/bin/data-dir
ENV PATH /opt/eosio/bin:/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
