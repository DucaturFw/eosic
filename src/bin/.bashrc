cd /playground
alias cleos="cleos --url http://development:8888 --wallet-url http://development:8888"
alias eosiocpp="/eosiocppfix"
echo "EOS Dev environment ready!"

# CREATE_WALLET=$(cleos --url http://nodeosd:8888 --wallet-url http://nodeosd:8888 wallet create | sed -n 4p)
# RESULT=$?
# echo $RESULT
# if [ $RESULT -eq 0 ]; then
#   echo "New wallet"
#   export PASSWORD=${CREATE_WALLET}
# else
#   echo "Use previous wallet"
# fi

# echo ${PASSWORD}
# # export PASSWORD="PW5K7m9ihxdpbzkfThWBitmVJ4GhoTKdm4hYL5YSRuHn321cvpKDL"
# # cleos wallet unlock --password ${PASSWORD}
# # export PKEY="$(cleos create key | sed -n '1{s/Private key: //p}')"
# # echo $PKEY