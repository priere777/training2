document.getElementById('calculateBtn').addEventListener('click', function() {
    // 1. ユーザーからの入力値を取得
    const initialAmount = parseFloat(document.getElementById('initialAmount').value) || 0;
    const monthlyContribution = parseFloat(document.getElementById('monthlyContribution').value) || 0;
    const annualRate = parseFloat(document.getElementById('annualRate').value) / 100;
    const years = parseInt(document.getElementById('years').value) || 0;
    
    // ★修正：ドロップダウンから選択された税率を取得
    const taxRateString = document.getElementById('taxRateType').value;
    const TAX_RATE = parseFloat(taxRateString);

    if (initialAmount < 0 || monthlyContribution < 0 || annualRate < 0 || years <= 0) {
        document.getElementById('result').innerHTML = '<p style="color: red;">入力値に誤りがあります。正の数を入力してください。</p>';
        return;
    }

    // 2. 複利計算の実行と月次データの記録（計算は複利のみに固定）
    let totalInvestment = initialAmount;
    let totalPrincipal = initialAmount;
    const monthlyRate = annualRate / 12;
    const monthlyData = [];
    const totalMonths = years * 12;

    for (let month = 1; month <= totalMonths; month++) {
        let monthlyInterest = 0;

        // 毎月の積立
        totalInvestment += monthlyContribution;
        totalPrincipal += monthlyContribution;

        // 複利計算
        monthlyInterest = totalInvestment * monthlyRate;
        totalInvestment += monthlyInterest;

        monthlyData.push({
            month: month,
            total: totalInvestment,
            interest: monthlyInterest,
            principal: totalPrincipal 
        });
    }

    // 3. 結果の計算と表示
    const finalTotalBeforeTax = monthlyData[monthlyData.length - 1].total;
    const finalPrincipal = monthlyData[monthlyData.length - 1].principal;
    const finalInterestBeforeTax = finalTotalBeforeTax - finalPrincipal; // 税引前の利息

    // 税金と税引後利益の計算
    const totalTax = finalInterestBeforeTax * TAX_RATE;
    const finalInterestAfterTax = finalInterestBeforeTax - totalTax;
    const finalTotalAfterTax = finalPrincipal + finalInterestAfterTax;

    // 日本円の形式にフォーマットする関数 (3桁区切り)
    const formatCurrency = (number) => {
        return Math.round(number).toLocaleString('ja-JP');
    };

    // 最終結果の表示
    let resultHTML = `
        <h3>計算結果 (複利)</h3>
        
        <p><strong>最終資産総額 (元本 + 利息):</strong> ${formatCurrency(finalTotalBeforeTax)} 円</p>
    `;
    
    // 税金控除が「なし」（TAX_RATEが0）ではない場合のみ税引後を表示
    if (TAX_RATE > 0) {
         const taxRatePercent = (TAX_RATE * 100).toFixed(3); // 0.20315 -> 20.315
         
         resultHTML += `
            <p style="font-size: 1.2em; color: #d9534f;">
                <strong>最終資産総額 (税引後):</strong> ${formatCurrency(finalTotalAfterTax)} 円
            </p>

            <p><strong>（内訳）</strong></p>
            <ul>
                <li>元本（投資した金額の合計）: ${formatCurrency(finalPrincipal)} 円</li>
                <li>利息（運用で増えた金額）： ${formatCurrency(finalInterestBeforeTax)} 円 (税引前)</li>
                <li style="color: #d9534f;">利息（運用で増えた金額）： ${formatCurrency(finalInterestAfterTax)} 円 (税引後)</li>
                <li>源泉徴収税額（${taxRatePercent}%）： ${formatCurrency(totalTax)} 円</li>
            </ul>
        `;
    } else {
        // 税金控除がない場合
        resultHTML += `
            <p><strong>（内訳）</strong></p>
            <ul>
                <li>元本（投資した金額の合計）: ${formatCurrency(finalPrincipal)} 円</li>
                <li>利息（運用で増えた金額）： ${formatCurrency(finalInterestBeforeTax)} 円</li>
            </ul>
        `;
    }

    // 月次利息の可視化 (テーブル形式)
    resultHTML += `
        <h3 style="margin-top: 30px;">月次利息の推移（最初の3年間と最終年）</h3>
        <table id="monthlyInterestTable">
            <thead>
                <tr>
                    <th>経過月数</th>
                    <th>月次利息</th>
                    <th>資産総額</th>
                </tr>
            </thead>
            <tbody>
                ${generateMonthlyTable(monthlyData, totalMonths, formatCurrency)}
            </tbody>
        </table>
    `;

    document.getElementById('result').innerHTML = resultHTML;
});

// 月次データのテーブルHTMLを生成する関数 (最初の3年間に固定)
function generateMonthlyTable(data, totalMonths, formatter) {
    let tableRows = '';
    
    const initialMonthsToShow = Math.min(36, totalMonths);

    // 最初の3年 (36ヶ月) のデータを追加
    for (let i = 0; i < initialMonthsToShow; i++) {
        const monthLabel = `${data[i].month}ヶ月`;
        
        tableRows += `
            <tr>
                <td>${monthLabel}</td>
                <td>${formatter(data[i].interest)} 円</td>
                <td>${formatter(data[i].total)} 円</td>
            </tr>
        `;
    }

    // データが3年以上ある場合、途中の区切りと最終年（12ヶ月）のデータを追加
    if (totalMonths > 36) {
        tableRows += `
            <tr class="separator"><td colspan="3">... 途中経過省略 ...</td></tr>
        `;
        // 最終年のデータ (totalMonths - 12 から totalMonths - 1 まで)
        for (let i = totalMonths - 12; i < totalMonths; i++) {
             const monthLabel = `${data[i].month}ヶ月 (最終年)`;
             
             tableRows += `
                <tr>
                    <td>${monthLabel}</td>
                    <td>${formatter(data[i].interest)} 円</td>
                    <td>${formatter(data[i].total)} 円</td> 
             </tr>
            `;
        }
    }
    return tableRows;
}