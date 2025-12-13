// تعديل الأسرة للمنشآت من بطاقات المنشآات الرئيسية
function editFacilityBeds(facilityId) {
    const facility = customFacilities.find(f => f.id === facilityId);
    if (!facility) return;

    // إنشاء نموذج تعديل مخصص
    const modalHTML = `
        <div id="editFacilityBedsModal" class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" style="display: flex;">
            <div class="bg-gradient-to-br from-indigo-900 to-purple-900 rounded-2xl p-6 border border-indigo-300/20 max-w-2xl w-full mx-4 max-h-90vh overflow-y-auto">
                <h2 class="text-white text-2xl font-bold mb-6">تعديل الأسرة - ${facility.name}</h2>
                
                <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <!-- ER -->
                    <div class="bg-indigo-800/30 rounded-lg p-4 border border-indigo-300/20">
                        <h3 class="text-indigo-200 font-bold mb-3">ER (أسرة الطوارئ)</h3>
                        <div class="space-y-2">
                            <div>
                                <label class="text-indigo-300 text-sm">المشغولة</label>
                                <input type="number" id="editErOccupied" class="w-full p-2 rounded-lg bg-white/10 border border-white/20 text-white" value="${facility.emergency?.occupied || 0}" min="0">
                            </div>
                            <div>
                                <label class="text-indigo-300 text-sm">الإجمالي</label>
                                <input type="number" id="editErTotal" class="w-full p-2 rounded-lg bg-white/10 border border-white/20 text-white" value="${facility.emergency?.total || 0}" min="0">
                            </div>
                            <div class="text-indigo-300 text-xs mt-2" id="erPercent">0%</div>
                        </div>
                    </div>
                    
                    <!-- ICU -->
                    <div class="bg-indigo-800/30 rounded-lg p-4 border border-indigo-300/20">
                        <h3 class="text-indigo-200 font-bold mb-3">ICU (العناية المركزة)</h3>
                        <div class="space-y-2">
                            <div>
                                <label class="text-indigo-300 text-sm">المشغولة</label>
                                <input type="number" id="editIcuOccupied" class="w-full p-2 rounded-lg bg-white/10 border border-white/20 text-white" value="${facility.icu?.occupied || 0}" min="0">
                            </div>
                            <div>
                                <label class="text-indigo-300 text-sm">الإجمالي</label>
                                <input type="number" id="editIcuTotal" class="w-full p-2 rounded-lg bg-white/10 border border-white/20 text-white" value="${facility.icu?.total || 0}" min="0">
                            </div>
                            <div class="text-indigo-300 text-xs mt-2" id="icuPercent">0%</div>
                        </div>
                    </div>
                    
                    <!-- CCU -->
                    <div class="bg-indigo-800/30 rounded-lg p-4 border border-indigo-300/20">
                        <h3 class="text-indigo-200 font-bold mb-3">CCU (العناية القلبية)</h3>
                        <div class="space-y-2">
                            <div>
                                <label class="text-indigo-300 text-sm">المشغولة</label>
                                <input type="number" id="editCcuOccupied" class="w-full p-2 rounded-lg bg-white/10 border border-white/20 text-white" value="${facility.ccu?.occupied || 0}" min="0">
                            </div>
                            <div>
                                <label class="text-indigo-300 text-sm">الإجمالي</label>
                                <input type="number" id="editCcuTotal" class="w-full p-2 rounded-lg bg-white/10 border border-white/20 text-white" value="${facility.ccu?.total || 0}" min="0">
                            </div>
                            <div class="text-indigo-300 text-xs mt-2" id="ccuPercent">0%</div>
                        </div>
                    </div>
                    
                    <!-- PICU -->
                    <div class="bg-indigo-800/30 rounded-lg p-4 border border-indigo-300/20">
                        <h3 class="text-indigo-200 font-bold mb-3">PICU (عناية الأطفال)</h3>
                        <div class="space-y-2">
                            <div>
                                <label class="text-indigo-300 text-sm">المشغولة</label>
                                <input type="number" id="editPicuOccupied" class="w-full p-2 rounded-lg bg-white/10 border border-white/20 text-white" value="${facility.picu?.occupied || 0}" min="0">
                            </div>
                            <div>
                                <label class="text-indigo-300 text-sm">الإجمالي</label>
                                <input type="number" id="editPicuTotal" class="w-full p-2 rounded-lg bg-white/10 border border-white/20 text-white" value="${facility.picu?.total || 0}" min="0">
                            </div>
                            <div class="text-indigo-300 text-xs mt-2" id="picuPercent">0%</div>
                        </div>
                    </div>
                    
                    <!-- NICU -->
                    <div class="bg-indigo-800/30 rounded-lg p-4 border border-indigo-300/20">
                        <h3 class="text-indigo-200 font-bold mb-3">NICU (عناية المواليد)</h3>
                        <div class="space-y-2">
                            <div>
                                <label class="text-indigo-300 text-sm">المشغولة</label>
                                <input type="number" id="editNicuOccupied" class="w-full p-2 rounded-lg bg-white/10 border border-white/20 text-white" value="${facility.nicu?.occupied || 0}" min="0">
                            </div>
                            <div>
                                <label class="text-indigo-300 text-sm">الإجمالي</label>
                                <input type="number" id="editNicuTotal" class="w-full p-2 rounded-lg bg-white/10 border border-white/20 text-white" value="${facility.nicu?.total || 0}" min="0">
                            </div>
                            <div class="text-indigo-300 text-xs mt-2" id="nicuPercent">0%</div>
                        </div>
                    </div>
                </div>
                
                <div class="flex space-x-3 space-x-reverse">
                    <button onclick="saveFacilityBedsChanges(${facilityId})" class="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded-lg">حفظ التعديلات</button>
                    <button onclick="closeFacilityBedsModal()" class="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg">إلغاء</button>
                </div>
            </div>
        </div>
    `;
    
    // إضافة النموذج إلى الصفحة
    const existingModal = document.getElementById('editFacilityBedsModal');
    if (existingModal) existingModal.remove();
    
    document.body.insertAdjacentHTML('beforeend', modalHTML);
    
    // إضافة مستمعي الأحداث لحساب النسب المئوية
    const inputs = ['editErOccupied', 'editErTotal', 'editIcuOccupied', 'editIcuTotal', 'editCcuOccupied', 'editCcuTotal', 'editPicuOccupied', 'editPicuTotal', 'editNicuOccupied', 'editNicuTotal'];
    inputs.forEach(id => {
        const input = document.getElementById(id);
        if (input) {
            input.addEventListener('input', updatePercentages);
        }
    });
    
    updatePercentages();
}

function updatePercentages() {
    const updatePercent = (occupiedId, totalId, percentId) => {
        const occupied = parseInt(document.getElementById(occupiedId)?.value || 0);
        const total = parseInt(document.getElementById(totalId)?.value || 0);
        const percent = total > 0 ? Math.round((occupied / total) * 100) : 0;
        const percentElement = document.getElementById(percentId);
        if (percentElement) {
            percentElement.textContent = `${percent}%`;
            // تغيير اللون بناءً على النسبة
            if (percent >= 75) percentElement.style.color = '#ef4444';
            else if (percent >= 50) percentElement.style.color = '#f97316';
            else percentElement.style.color = '#10b981';
        }
    };
    
    updatePercent('editErOccupied', 'editErTotal', 'erPercent');
    updatePercent('editIcuOccupied', 'editIcuTotal', 'icuPercent');
    updatePercent('editCcuOccupied', 'editCcuTotal', 'ccuPercent');
    updatePercent('editPicuOccupied', 'editPicuTotal', 'picuPercent');
    updatePercent('editNicuOccupied', 'editNicuTotal', 'nicuPercent');
}

function closeFacilityBedsModal() {
    const modal = document.getElementById('editFacilityBedsModal');
    if (modal) modal.remove();
}

function saveFacilityBedsChanges(facilityId) {
    const erOccupied = parseInt(document.getElementById('editErOccupied')?.value || 0);
    const erTotal = parseInt(document.getElementById('editErTotal')?.value || 0);
    const icuOccupied = parseInt(document.getElementById('editIcuOccupied')?.value || 0);
    const icuTotal = parseInt(document.getElementById('editIcuTotal')?.value || 0);
    const ccuOccupied = parseInt(document.getElementById('editCcuOccupied')?.value || 0);
    const ccuTotal = parseInt(document.getElementById('editCcuTotal')?.value || 0);
    const picuOccupied = parseInt(document.getElementById('editPicuOccupied')?.value || 0);
    const picuTotal = parseInt(document.getElementById('editPicuTotal')?.value || 0);
    const nicuOccupied = parseInt(document.getElementById('editNicuOccupied')?.value || 0);
    const nicuTotal = parseInt(document.getElementById('editNicuTotal')?.value || 0);
    
    // التحقق من صحة البيانات
    if (erOccupied > erTotal || icuOccupied > icuTotal || ccuOccupied > ccuTotal || picuOccupied > picuTotal || nicuOccupied > nicuTotal) {
        alert('❌ عدد الأسرة المشغولة لا يمكن أن يتجاوز العدد الإجمالي');
        return;
    }
    
    const facilityIndex = customFacilities.findIndex(f => f.id === facilityId);
    if (facilityIndex !== -1) {
        customFacilities[facilityIndex].emergency = { occupied: erOccupied, total: erTotal };
        customFacilities[facilityIndex].icu = { occupied: icuOccupied, total: icuTotal };
        customFacilities[facilityIndex].ccu = { occupied: ccuOccupied, total: ccuTotal };
        customFacilities[facilityIndex].picu = { occupied: picuOccupied, total: picuTotal };
        customFacilities[facilityIndex].nicu = { occupied: nicuOccupied, total: nicuTotal };
        
        localStorage.setItem('customFacilities', JSON.stringify(customFacilities));
        renderFacilitiesCards();
        closeFacilityBedsModal();
        alert('✅ تم تحديث الأسرة بنجاح!');
    }
}
