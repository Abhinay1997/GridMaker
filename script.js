document.addEventListener('DOMContentLoaded', () => {
    // --- GET ELEMENTS ---
    const gridContainer = document.getElementById('grid-container');
    const columnControls = document.getElementById('column-controls');
    const rowControls = document.getElementById('row-controls');
    const addImageBtn = document.getElementById('add-image');
    const addTextBtn = document.getElementById('add-text');
    const columnsInput = document.getElementById('columns');
    const cellSpacingInput = document.getElementById('cell-spacing');
    const exportPngBtn = document.getElementById('export-png');
    const exportJpgBtn = document.getElementById('export-jpg');
    const exportPdfBtn = document.getElementById('export-pdf');
    const gridTitleInput = document.getElementById('grid-title-input');
    const gridTitle = document.getElementById('grid-title');
    const exportContainer = document.getElementById('export-container');
    const titleFontSelect = document.getElementById('title-font');
    const titleFontSizeInput = document.getElementById('title-font-size');
    const titleAlignSelect = document.getElementById('title-align');

    // --- STATE VARIABLES ---
    let selectedItem = null;
    let contextMenu = null;
    const fonts = ['Arial', 'Verdana', 'Times New Roman', 'Georgia', 'Courier New', 'Cursive', 'Fantasy'];

    // --- FONT POPULATION ---
    fonts.forEach(font => {
        const option = document.createElement('option');
        option.value = font;
        option.textContent = font;
        titleFontSelect.appendChild(option);
    });

    // --- FUNCTION DEFINITIONS ---
    const applyGridSizing = () => {
        const colWidths = Array.from(columnControls.children).map(input => `${input.value}px`).join(' ');
        const rowHeights = Array.from(rowControls.children).map(input => `${input.value}px`).join(' ');
        
        gridContainer.style.gridTemplateColumns = colWidths;
        gridContainer.style.gridTemplateRows = rowHeights;
    };

    const updateLayoutControls = () => {
        const numColumns = parseInt(columnsInput.value, 10);
        const numItems = gridContainer.children.length;
        const numRows = Math.ceil(numItems / numColumns) || 1;

        const oldColWidths = Array.from(columnControls.children).map(input => input.value);
        const oldRowHeights = Array.from(rowControls.children).map(input => input.value);

        columnControls.innerHTML = '';
        for (let i = 0; i < numColumns; i++) {
            const input = document.createElement('input');
            input.type = 'number';
            input.className = 'form-control form-control-sm';
            input.value = oldColWidths[i] || 150;
            input.addEventListener('input', applyGridSizing);
            columnControls.appendChild(input);
        }

        rowControls.innerHTML = '';
        for (let i = 0; i < numRows; i++) {
            const input = document.createElement('input');
            input.type = 'number';
            input.className = 'form-control form-control-sm';
            input.value = oldRowHeights[i] || 150;
            input.addEventListener('input', applyGridSizing);
            rowControls.appendChild(input);
        }
        applyGridSizing();
    };

    const createImageCell = (src) => {
        const item = document.createElement('div');
        item.classList.add('grid-item');
        const img = document.createElement('img');
        img.src = src;
        item.appendChild(img);
        gridContainer.appendChild(item);
        updateLayoutControls();
    };

    const createTextCell = () => {
        const item = document.createElement('div');
        item.classList.add('grid-item');
        const textArea = document.createElement('textarea');
        textArea.classList.add('text-cell');
        textArea.placeholder = 'Enter text...';
        item.appendChild(textArea);
        gridContainer.appendChild(item);
        updateLayoutControls();
    };

    const updateCellSpacing = () => {
        const spacing = `${cellSpacingInput.value}px`;
        gridContainer.style.gap = spacing;
        columnControls.style.gap = spacing;
        rowControls.style.gap = spacing;
    };

    const exportGrid = (format) => {
        deselectAll();
        exportContainer.classList.add('exporting');

        html2canvas(exportContainer).then(canvas => {
            exportContainer.classList.remove('exporting');
            const link = document.createElement('a');
            link.download = `grid.${format}`;
            if (format === 'pdf') {
                const { jsPDF } = window.jspdf;
                const doc = new jsPDF();
                const imgData = canvas.toDataURL('image/png');
                const imgProps = doc.getImageProperties(imgData);
                const pdfWidth = doc.internal.pageSize.getWidth();
                const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
                doc.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                doc.save('grid.pdf');
            } else {
                link.href = canvas.toDataURL(`image/${format}`);
                link.click();
            }
        });
    };

    const hideContextMenu = () => {
        if (contextMenu) contextMenu.remove();
        contextMenu = null;
    };

    const deselectAll = () => {
        if (selectedItem) selectedItem.classList.remove('selected');
        selectedItem = null;
        hideContextMenu();
    };

    const createFontSelector = (textArea) => {
        const select = document.createElement('select');
        select.className = 'form-select form-select-sm mt-2';
        fonts.forEach(font => {
            const option = document.createElement('option');
            option.value = font;
            option.textContent = font;
            if (textArea.style.fontFamily === font) option.selected = true;
            select.appendChild(option);
        });
        select.onchange = () => textArea.style.fontFamily = select.value;
        return select;
    };

    const createAlignmentControls = (textArea) => {
        const container = document.createElement('div');
        container.className = 'btn-group btn-group-sm w-100 mt-2';
        ['left', 'center', 'right'].forEach(align => {
            const button = document.createElement('button');
            button.className = 'btn btn-outline-secondary';
            button.textContent = align.charAt(0).toUpperCase();
            button.onclick = () => textArea.style.textAlign = align;
            container.appendChild(button);
        });
        return container;
    };

    const showContextMenu = (item) => {
        hideContextMenu();
        contextMenu = document.createElement('div');
        contextMenu.classList.add('context-menu');
        // Stop clicks inside the menu from bubbling up to other listeners
        contextMenu.addEventListener('click', e => e.stopPropagation());

        const removeBtn = document.createElement('button');
        removeBtn.className = 'btn btn-danger btn-sm w-100';
        removeBtn.textContent = 'Remove';
        removeBtn.addEventListener('click', () => {
            item.remove();
            updateLayoutControls();
            deselectAll();
        });
        contextMenu.appendChild(removeBtn);

        if (item.querySelector('.text-cell')) {
            const textArea = item.querySelector('.text-cell');
            contextMenu.appendChild(createFontSelector(textArea));
            contextMenu.appendChild(createAlignmentControls(textArea));
        }
        item.appendChild(contextMenu);
    };

    const selectItem = (item) => {
        deselectAll();
        selectedItem = item;
        selectedItem.classList.add('selected');
        showContextMenu(selectedItem);
    };

    const updateTitleStyle = () => {
        gridTitle.textContent = gridTitleInput.value;
        gridTitle.style.fontFamily = titleFontSelect.value;
        gridTitle.style.fontSize = `${titleFontSizeInput.value}px`;
        gridTitle.style.textAlign = titleAlignSelect.value;
    };

    // --- INITIALIZE SORTABLE ---
    new Sortable(gridContainer, {
        animation: 150,
        ghostClass: 'blue-background-class',
        onEnd: updateLayoutControls,
    });

    // --- EVENT LISTENERS ---
    gridContainer.addEventListener('click', e => {
        const clickedItem = e.target.closest('.grid-item');
        if (clickedItem) {
            selectItem(clickedItem);
        }
    });
    document.addEventListener('click', e => {
        if (!e.target.closest('.grid-item') && !e.target.closest('.context-menu')) {
            deselectAll();
        }
    });
    addImageBtn.addEventListener('change', e => {
        for (const file of e.target.files) {
            const reader = new FileReader();
            reader.onload = event => createImageCell(event.target.result);
            reader.readAsDataURL(file);
        }
    });
    addTextBtn.addEventListener('click', createTextCell);
    columnsInput.addEventListener('input', updateLayoutControls);
    cellSpacingInput.addEventListener('input', updateCellSpacing);
    [gridTitleInput, titleFontSelect, titleFontSizeInput, titleAlignSelect].forEach(el => {
        el.addEventListener('input', updateTitleStyle);
    });
    exportPngBtn.addEventListener('click', () => exportGrid('png'));
    exportJpgBtn.addEventListener('click', () => exportGrid('jpg'));
    exportPdfBtn.addEventListener('click', () => exportGrid('pdf'));

    // --- INITIAL SETUP ---
    updateLayoutControls();
    updateCellSpacing();
    updateTitleStyle();
});
