

def myhash(msg, n_rounds=5):
    if n_rounds <= 0:
        return msg
    if n_rounds > 9:
        print('n_rounds cannot be greater than 9')
        return
    
    ciphertext = b''
    
    