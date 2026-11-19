sudo apt update

sudo grep -c "svm\|vmx" /proc/cpuinfo

kvm -ok

sudo apt install cpu-checker

sudo apt install qemu-kvm virt-manager libvirt-daemon-system libvirt-clients bridge-utils -y


sudo systemctl enable libvirtd

sudo systemctl start libvirtd

sudo usermod -aG kvm parth

sudo usermod -aG libvirt parth

sudo usermod -aG libvirt parth

after running this command in the terminal open the vmm (virtual machine manager) then you can see the QEMU/kvm if it showing not connected then restart then again see you can able to see QEMU/kvm is connected then click on the create new virtual machine then on next page that appear click forward then it will ask for iso or osrm something then click on browse then + icon then it will auto detect just click next then then select the os version  choose volume then after the hardware configurtion finish the process black screen will we can see
